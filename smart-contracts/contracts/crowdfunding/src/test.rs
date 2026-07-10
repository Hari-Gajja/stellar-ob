#![cfg(test)]
extern crate std;

use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::{Address, Env, String};

fn default_deadline(env: &Env) -> u64 {
    env.ledger().timestamp() + 30 * 24 * 60 * 60
}

#[test]
fn create_and_donate_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let owner = Address::generate(&env);
    let donor = Address::generate(&env);

    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    client.initialize();

    let deadline = default_deadline(&env);

    let campaign_id = client.create_campaign(
        &owner,
        &String::from_str(&env, "Open-source tooling fund"),
        &String::from_str(&env, "Support the next generation of Stellar builders."),
        &25_000_000i128,
        &deadline,
    );

    assert_eq!(campaign_id, 1);

    let campaign = client.get_campaign(&campaign_id);
    assert_eq!(campaign.name, String::from_str(&env, "Open-source tooling fund"));
    assert!(campaign.active);
    assert_eq!(campaign.total_raised, 0);

    client.donate(&campaign_id, &donor, &10_000_000i128);
    client.donate(&campaign_id, &donor, &5_000_000i128);

    let updated = client.get_campaign(&campaign_id);
    assert_eq!(updated.total_raised, 15_000_000);
    assert_eq!(updated.contributor_count, 1);

    let donations = client.get_recent_donations(&campaign_id, &10);
    assert_eq!(donations.len(), 2);

    let all = client.get_all_campaigns();
    assert_eq!(all.len(), 1);
}

#[test]
fn multiple_campaigns() {
    let env = Env::default();
    env.mock_all_auths();

    let owner = Address::generate(&env);
    let donor = Address::generate(&env);

    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    client.initialize();

    let deadline = default_deadline(&env);

    let id1 = client.create_campaign(
        &owner,
        &String::from_str(&env, "Campaign A"),
        &String::from_str(&env, "First campaign"),
        &10_000_000i128,
        &deadline,
    );

    let id2 = client.create_campaign(
        &owner,
        &String::from_str(&env, "Campaign B"),
        &String::from_str(&env, "Second campaign"),
        &20_000_000i128,
        &deadline,
    );

    assert_eq!(id1, 1);
    assert_eq!(id2, 2);

    client.donate(&id1, &donor, &5_000_000i128);
    client.donate(&id2, &donor, &10_000_000i128);

    let c1 = client.get_campaign(&id1);
    let c2 = client.get_campaign(&id2);

    assert_eq!(c1.total_raised, 5_000_000);
    assert_eq!(c2.total_raised, 10_000_000);

    let all = client.get_all_campaigns();
    assert_eq!(all.len(), 2);
}

#[test]
fn close_campaign() {
    let env = Env::default();
    env.mock_all_auths();

    let owner = Address::generate(&env);
    let donor = Address::generate(&env);

    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    client.initialize();

    let deadline = default_deadline(&env);

    let campaign_id = client.create_campaign(
        &owner,
        &String::from_str(&env, "Closable Fund"),
        &String::from_str(&env, "Will be closed"),
        &100_000_000i128,
        &deadline,
    );

    client.close_campaign(&campaign_id);

    let campaign = client.get_campaign(&campaign_id);
    assert!(!campaign.active);

    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.donate(&campaign_id, &donor, &1_000_000i128);
    }));
    assert!(result.is_err());
}

#[test]
fn rejects_invalid_amount() {
    let env = Env::default();
    env.mock_all_auths();

    let owner = Address::generate(&env);
    let donor = Address::generate(&env);

    let contract_id = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &contract_id);

    client.initialize();

    let deadline = default_deadline(&env);

    let campaign_id = client.create_campaign(
        &owner,
        &String::from_str(&env, "Builder fund"),
        &String::from_str(&env, "A tiny public goods campaign."),
        &1_000_000i128,
        &deadline,
    );

    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.donate(&campaign_id, &donor, &0i128);
    }));
    assert!(result.is_err());
}
