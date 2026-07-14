default: build

build:
	stellar contract build

test:
	stellar contract test

deploy-treasury:
	stellar contract deploy \
		--network testnet \
		--source testnet \
		--wasm target/wasm32v1-none/release/treasury.wasm

deploy-crowdfunding:
	stellar contract deploy \
		--network testnet \
		--source testnet \
		--wasm target/wasm32v1-none/release/crowdfunding.wasm

deploy-testnet: build deploy-treasury deploy-crowdfunding
