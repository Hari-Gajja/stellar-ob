#![cfg(test)]
extern crate std;

use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::testutils::Ledger as _;
use soroban_sdk::{Address, Env, String};

use treasury::TreasuryContractClient;

fn setup_env() -> (Env, Address, Address, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let owner = Address::generate(&env);
    let donor = Address::generate(&env);

    let treasury_address = env.register(treasury::TreasuryContract, ());
    let treasury_client = TreasuryContractClient::new(&env, &treasury_address);
    treasury_client.initialize(&admin);

    let crowdfunding_address = env.register(CrowdfundingContract, ());
    let client = CrowdfundingContractClient::new(&env, &crowdfunding_address);
    client.initialize(&treasury_address);

    (env, crowdfunding_address, owner, donor, treasury_address)
}

fn default_deadline(env: &Env) -> u64 {
    env.ledger().timestamp() + 30 * 24 * 60 * 60
}

#[test]
fn test_create_campaign() {
    let (env, crowdfunding_address, owner, _donor, _treasury) = setup_env();
    let client = CrowdfundingContractClient::new(&env, &crowdfunding_address);

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
    assert_eq!(
        campaign.name,
        String::from_str(&env, "Open-source tooling fund")
    );
    assert_eq!(campaign.status, CampaignStatus::Active);
    assert_eq!(campaign.total_raised, 0);
}

#[test]
fn test_donate_updates_treasury() {
    let (env, crowdfunding_address, owner, donor, treasury_address) = setup_env();
    let client = CrowdfundingContractClient::new(&env, &crowdfunding_address);
    let treasury_client = TreasuryContractClient::new(&env, &treasury_address);

    let deadline = default_deadline(&env);

    let campaign_id = client.create_campaign(
        &owner,
        &String::from_str(&env, "Test Fund"),
        &String::from_str(&env, "Test description"),
        &100_000_000i128,
        &deadline,
    );

    client.donate(&campaign_id, &donor, &10_000_000i128);
    client.donate(&campaign_id, &donor, &5_000_000i128);

    let campaign = client.get_campaign(&campaign_id);
    assert_eq!(campaign.total_raised, 15_000_000);
    assert_eq!(campaign.contributor_count, 1);

    let treasury_balance = treasury_client.get_balance(&campaign_id);
    assert_eq!(treasury_balance, 15_000_000);

    let contrib_balance = client.get_contributor(&campaign_id, &donor);
    assert_eq!(contrib_balance, 15_000_000);
}

#[test]
fn test_withdraw_funds() {
    let (env, crowdfunding_address, owner, donor, treasury_address) = setup_env();
    let client = CrowdfundingContractClient::new(&env, &crowdfunding_address);
    let treasury_client = TreasuryContractClient::new(&env, &treasury_address);

    let deadline = default_deadline(&env);

    let campaign_id = client.create_campaign(
        &owner,
        &String::from_str(&env, "Withdraw Test"),
        &String::from_str(&env, "Testing withdrawal"),
        &10_000_000i128,
        &deadline,
    );

    client.donate(&campaign_id, &donor, &15_000_000i128);

    env.ledger().set_timestamp(env.ledger().timestamp() + 31 * 24 * 60 * 60);

    client.close_campaign(&campaign_id);

    let campaign = client.get_campaign(&campaign_id);
    assert_eq!(campaign.status, CampaignStatus::Successful);

    client.withdraw_funds(&campaign_id);

    let treasury_balance = treasury_client.get_balance(&campaign_id);
    assert_eq!(treasury_balance, 0);

    let campaign = client.get_campaign(&campaign_id);
    assert_eq!(campaign.status, CampaignStatus::Closed);
}

#[test]
fn test_refund_on_failed_campaign() {
    let (env, crowdfunding_address, owner, donor, treasury_address) = setup_env();
    let client = CrowdfundingContractClient::new(&env, &crowdfunding_address);
    let treasury_client = TreasuryContractClient::new(&env, &treasury_address);

    let deadline = default_deadline(&env);

    let campaign_id = client.create_campaign(
        &owner,
        &String::from_str(&env, "Refund Test"),
        &String::from_str(&env, "Testing refunds"),
        &100_000_000i128,
        &deadline,
    );

    client.donate(&campaign_id, &donor, &10_000_000i128);

    env.ledger().set_timestamp(env.ledger().timestamp() + 31 * 24 * 60 * 60);

    client.close_campaign(&campaign_id);

    let campaign = client.get_campaign(&campaign_id);
    assert_eq!(campaign.status, CampaignStatus::Failed);

    let contrib_before = client.get_contributor(&campaign_id, &donor);
    assert_eq!(contrib_before, 10_000_000);

    client.refund(&campaign_id, &donor);

    let contrib_after = client.get_contributor(&campaign_id, &donor);
    assert_eq!(contrib_after, 0);

    let treasury_balance = treasury_client.get_balance(&campaign_id);
    assert_eq!(treasury_balance, 0);
}

#[test]
fn test_multiple_campaigns() {
    let (env, crowdfunding_address, owner, donor, _treasury) = setup_env();
    let client = CrowdfundingContractClient::new(&env, &crowdfunding_address);

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
fn test_close_campaign_early() {
    let (env, crowdfunding_address, owner, _donor, _treasury) = setup_env();
    let client = CrowdfundingContractClient::new(&env, &crowdfunding_address);

    let deadline = default_deadline(&env);

    let campaign_id = client.create_campaign(
        &owner,
        &String::from_str(&env, "Early Close"),
        &String::from_str(&env, "Will be closed early"),
        &100_000_000i128,
        &deadline,
    );

    client.close_campaign(&campaign_id);

    let campaign = client.get_campaign(&campaign_id);
    assert_eq!(campaign.status, CampaignStatus::Closed);
}

#[test]
fn test_rejects_invalid_amount() {
    let (env, crowdfunding_address, owner, donor, _treasury) = setup_env();
    let client = CrowdfundingContractClient::new(&env, &crowdfunding_address);

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

#[test]
fn test_rejects_donation_after_deadline() {
    let (env, crowdfunding_address, owner, donor, _treasury) = setup_env();
    let client = CrowdfundingContractClient::new(&env, &crowdfunding_address);

    let deadline = default_deadline(&env);

    let campaign_id = client.create_campaign(
        &owner,
        &String::from_str(&env, "Expired Fund"),
        &String::from_str(&env, "Testing deadline"),
        &10_000_000i128,
        &deadline,
    );

    env.ledger().set_timestamp(env.ledger().timestamp() + 31 * 24 * 60 * 60);

    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.donate(&campaign_id, &donor, &1_000_000i128);
    }));
    assert!(result.is_err());
}

#[test]
fn test_contributor_only_refund() {
    let (env, crowdfunding_address, owner, donor, _treasury) = setup_env();
    let client = CrowdfundingContractClient::new(&env, &crowdfunding_address);

    let deadline = default_deadline(&env);

    let campaign_id = client.create_campaign(
        &owner,
        &String::from_str(&env, "Auth Refund"),
        &String::from_str(&env, "Testing auth"),
        &100_000_000i128,
        &deadline,
    );

    client.donate(&campaign_id, &donor, &10_000_000i128);

    env.ledger().set_timestamp(env.ledger().timestamp() + 31 * 24 * 60 * 60);

    let stranger = Address::generate(&env);
    let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.refund(&campaign_id, &stranger);
    }));
    assert!(result.is_err());
}
