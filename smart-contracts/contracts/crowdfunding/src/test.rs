#![cfg(test)]
extern crate std;

use super::*;
use soroban_sdk::{Address, Env, String};
use soroban_sdk::testutils::{Address as _, Events as _};

#[test]
fn initialize_and_donate_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let owner = Address::generate(&env);
    let donor = Address::generate(&env);

    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    client.initialize_campaign(
        &owner,
        &String::from_str(&env, "Open-source tooling fund"),
        &String::from_str(&env, "Support the next generation of Stellar builders."),
        &25_000_000i128,
    );

    let init_events = env.events().all();
    assert_eq!(init_events.events().len(), 1);

    client.donate(&donor, &10_000_000i128, &String::from_str(&env, "tx-001"));
    let donate_events1 = env.events().all();
    assert_eq!(donate_events1.events().len(), 1);

    client.donate(&donor, &5_000_000i128, &String::from_str(&env, "tx-002"));
    let donate_events2 = env.events().all();
    assert_eq!(donate_events2.events().len(), 1);

    assert_eq!(client.get_total(), 15_000_000);
    assert_eq!(client.get_contributor_count(), 1);

    let donations = client.get_recent_donations(&10);
    assert_eq!(donations.len(), 2);
    assert_eq!(donations.get(0).unwrap().transaction_id, String::from_str(&env, "tx-001"));
}

#[test]
fn rejects_invalid_amount() {
    let env = Env::default();
    env.mock_all_auths();

    let owner = Address::generate(&env);
    let donor = Address::generate(&env);

    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    client.initialize_campaign(
        &owner,
        &String::from_str(&env, "Builder fund"),
        &String::from_str(&env, "A tiny public goods campaign."),
        &1_000_000i128,
    );

    client.donate(&donor, &1_000_000i128, &String::from_str(&env, "tx-003"));
    assert_eq!(client.get_total(), 1_000_000);
}