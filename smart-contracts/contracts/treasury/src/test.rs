#![cfg(test)]
extern crate std;

use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{Address, Env};

#[test]
fn test_deposit_and_balance() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let contract_id = env.register(TreasuryContract, ());
    let client = TreasuryContractClient::new(&env, &contract_id);

    client.initialize(&admin);

    client.deposit(&1, &1000_i128);
    assert_eq!(client.get_balance(&1), 1000);

    client.deposit(&1, &500_i128);
    assert_eq!(client.get_balance(&1), 1500);
}

#[test]
fn test_withdraw() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let contract_id = env.register(TreasuryContract, ());
    let client = TreasuryContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    client.deposit(&1, &2000_i128);

    client.withdraw(&1, &800_i128);
    assert_eq!(client.get_balance(&1), 1200);
}

#[test]
fn test_lock_prevents_withdraw() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let contract_id = env.register(TreasuryContract, ());
    let client = TreasuryContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    client.deposit(&1, &2000_i128);
    client.lock(&admin, &1);

    assert!(client.get_locked(&1));

    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.withdraw(&1, &500_i128);
    }));
    assert!(result.is_err());
}

#[test]
fn test_unlock_allows_withdraw() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let contract_id = env.register(TreasuryContract, ());
    let client = TreasuryContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    client.deposit(&1, &2000_i128);
    client.lock(&admin, &1);
    client.unlock(&admin, &1);

    assert!(!client.get_locked(&1));
    client.withdraw(&1, &500_i128);
    assert_eq!(client.get_balance(&1), 1500);
}

#[test]
fn test_insufficient_balance() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let contract_id = env.register(TreasuryContract, ());
    let client = TreasuryContractClient::new(&env, &contract_id);

    client.initialize(&admin);
    client.deposit(&1, &500_i128);

    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.withdraw(&1, &1000_i128);
    }));
    assert!(result.is_err());
}

#[test]
fn test_invalid_amount() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let contract_id = env.register(TreasuryContract, ());
    let client = TreasuryContractClient::new(&env, &contract_id);

    client.initialize(&admin);

    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.deposit(&1, &0_i128);
    }));
    assert!(result.is_err());
}

#[test]
fn test_multiple_campaigns_independent() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let contract_id = env.register(TreasuryContract, ());
    let client = TreasuryContractClient::new(&env, &contract_id);

    client.initialize(&admin);

    client.deposit(&1, &1000_i128);
    client.deposit(&2, &2000_i128);
    client.deposit(&3, &3000_i128);

    assert_eq!(client.get_balance(&1), 1000);
    assert_eq!(client.get_balance(&2), 2000);
    assert_eq!(client.get_balance(&3), 3000);

    client.lock(&admin, &1);
    assert!(client.get_locked(&1));
    assert!(!client.get_locked(&2));
    assert!(!client.get_locked(&3));
}

#[test]
fn test_double_initialize_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let contract_id = env.register(TreasuryContract, ());
    let client = TreasuryContractClient::new(&env, &contract_id);

    client.initialize(&admin);

    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.initialize(&admin);
    }));
    assert!(result.is_err());
}

#[test]
fn test_unauthorized_lock_fails() {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let stranger = Address::generate(&env);
    let contract_id = env.register(TreasuryContract, ());
    let client = TreasuryContractClient::new(&env, &contract_id);

    client.initialize(&admin);

    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.lock(&stranger, &1);
    }));
    assert!(result.is_err());
}
