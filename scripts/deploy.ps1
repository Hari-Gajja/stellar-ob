param(
    [Parameter(Mandatory = $false)]
    [string]$Network = "testnet",
    [Parameter(Mandatory = $false)]
    [string]$RpcUrl = "https://soroban-testnet.stellar.org",
    [Parameter(Mandatory = $false)]
    [string]$NetworkPassphrase = "Test SDF Network ; September 2015"
)

$ErrorActionPreference = "Stop"
$RootDir = Split-Path -Parent $PSScriptRoot
$ContractsDir = Join-Path $RootDir "smart-contracts"
$TargetDir = Join-Path $ContractsDir "target\wasm32v1-none\release"

Write-Host "=== Stellar Orange Belt Deployment Script ===" -ForegroundColor Cyan
Write-Host "Network: $Network"

# Step 1: Build contracts
Write-Host "`n[1/5] Building contracts..." -ForegroundColor Yellow
Set-Location $ContractsDir
cargo build --target wasm32v1-none --release -p treasury
if (-not $?) { throw "Treasury build failed" }
cargo build --target wasm32v1-none --release -p crowdfunding
if (-not $?) { throw "Crowdfunding build failed" }

# Step 2: Configure network
Write-Host "`n[2/5] Configuring network..." -ForegroundColor Yellow
stellar network add $Network `
    --rpc-url $RpcUrl `
    --network-passphrase "$NetworkPassphrase"

$AdminAddress = stellar keys address $Network

# Step 3: Deploy treasury
Write-Host "`n[3/5] Deploying treasury contract..." -ForegroundColor Yellow
$TreasuryWasm = Join-Path $TargetDir "treasury.wasm"
$TreasuryId = stellar contract deploy `
    --wasm $TreasuryWasm `
    --source $Network `
    --network $Network

Write-Host "Treasury Contract ID: $TreasuryId" -ForegroundColor Green

# Initialize treasury with admin
Write-Host "Initializing treasury..." -ForegroundColor Yellow
stellar contract invoke `
    --id $TreasuryId `
    --source $Network `
    --network $Network `
    -- `
    initialize --admin $AdminAddress

# Step 4: Deploy crowdfunding
Write-Host "`n[4/5] Deploying crowdfunding contract..." -ForegroundColor Yellow
$CrowdfundingWasm = Join-Path $TargetDir "crowdfunding.wasm"
$CrowdfundingId = stellar contract deploy `
    --wasm $CrowdfundingWasm `
    --source $Network `
    --network $Network

Write-Host "Crowdfunding Contract ID: $CrowdfundingId" -ForegroundColor Green

# Initialize crowdfunding with treasury address
Write-Host "Initializing crowdfunding..." -ForegroundColor Yellow
stellar contract invoke `
    --id $CrowdfundingId `
    --source $Network `
    --network $Network `
    -- `
    initialize --treasury_address $TreasuryId

# Step 5: Save contract IDs to .env
Write-Host "`n[5/5] Saving contract IDs..." -ForegroundColor Yellow
$EnvFile = Join-Path $RootDir "frontend\.env"
@"
VITE_RPC_URL=$RpcUrl
VITE_NETWORK_PASSPHRASE=$NetworkPassphrase
VITE_CONTRACT_ID=$CrowdfundingId
VITE_TREASURY_CONTRACT_ID=$TreasuryId
"@ | Set-Content -Path $EnvFile

Write-Host "`n=== Deployment Complete ===" -ForegroundColor Cyan
Write-Host "Treasury:      $TreasuryId" -ForegroundColor Green
Write-Host "Crowdfunding:  $CrowdfundingId" -ForegroundColor Green
Write-Host "Env file:      $EnvFile" -ForegroundColor Green

Set-Location $RootDir
