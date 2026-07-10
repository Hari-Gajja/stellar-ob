default: build

build:
	stellar contract build

test:
	stellar contract test

deploy-testnet:
	stellar contract deploy \
		--network testnet \
		--source user \
		--wasm target/wasm32v1-none/release/crowdfunding.wasm
