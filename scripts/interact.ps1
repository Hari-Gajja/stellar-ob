param(
    [Parameter(Mandatory = $true)]
    [string]$ContractId,
    [Parameter(Mandatory = $false)]
    [string]$Network = "testnet",
    [Parameter(Mandatory = $false)]
    [string]$RpcUrl = "https://soroban-testnet.stellar.org",
    [Parameter(Mandatory = $false)]
    [string]$NetworkPassphrase = "Test SDF Network ; September 2015"
)

$ErrorActionPreference = "Stop"

Write-Host "=== Stellar Orange Belt Interaction Script ===" -ForegroundColor Cyan
Write-Host "Contract: $ContractId"
Write-Host "Network:  $Network"

# Example 1: Get all campaigns (read)
Write-Host "`n[1] Getting all campaigns..." -ForegroundColor Yellow
stellar contract invoke `
    --id $ContractId `
    --network $Network `
    -- `
    get_all_campaigns

# Example 2: Create a campaign (write)
Write-Host "`n[2] Creating a test campaign..." -ForegroundColor Yellow
$OwnerAddress = stellar keys address $Network
$Deadline = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds() + 30 * 24 * 60 * 60

stellar contract invoke `
    --id $ContractId `
    --source $Network `
    --network $Network `
    -- `
    create_campaign `
    --owner $OwnerAddress `
    --name "Test Campaign" `
    --description "A test campaign deployed via script" `
    --funding_goal 10000000000000 `
    --deadline $Deadline

# Example 3: Get campaign by ID
Write-Host "`n[3] Getting campaign #1..." -ForegroundColor Yellow
stellar contract invoke `
    --id $ContractId `
    --network $Network `
    -- `
    get_campaign `
    --campaign_id 1

Write-Host "`n=== Interaction Complete ===" -ForegroundColor Cyan
