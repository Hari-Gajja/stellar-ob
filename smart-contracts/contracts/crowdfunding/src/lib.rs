#![no_std]

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, panic_with_error,
    Address, Env, IntoVal, String, Symbol, Val, Vec,
};

#[contract]
pub struct CrowdfundingContract;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CampaignData {
    pub id: u32,
    pub owner: Address,
    pub name: String,
    pub description: String,
    pub funding_goal: i128,
    pub total_raised: i128,
    pub contributor_count: u32,
    pub created_at: u64,
    pub deadline: u64,
    pub status: CampaignStatus,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum CampaignStatus {
    Active,
    Successful,
    Failed,
    Closed,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DonationRecord {
    pub campaign_id: u32,
    pub donor: Address,
    pub amount: i128,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Campaign(u32),
    Donations(u32),
    Contributors(u32),
    Contributor(u32, Address),
    CampaignCount,
    Initialized,
    TreasuryAddress,
}

#[contracterror]
#[derive(Clone, Copy, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContractError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    InvalidAmount = 4,
    InvalidGoal = 5,
    CampaignNotFound = 6,
    CampaignClosed = 7,
    CampaignExpired = 8,
    CampaignNotSuccessful = 9,
    CampaignNotFailed = 10,
    AlreadyRefunded = 11,
    WithdrawFailed = 12,
    RefundFailed = 13,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CampaignCreatedEvent {
    pub owner: Address,
    pub campaign_id: u32,
    pub name: String,
    pub funding_goal: i128,
    pub deadline: u64,
    pub timestamp: u64,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DonationReceivedEvent {
    pub campaign_id: u32,
    pub donor: Address,
    pub amount: i128,
    pub timestamp: u64,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CampaignClosedEvent {
    pub campaign_id: u32,
    pub status: CampaignStatus,
    pub timestamp: u64,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FundsWithdrawnEvent {
    pub campaign_id: u32,
    pub owner: Address,
    pub amount: i128,
    pub timestamp: u64,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct RefundIssuedEvent {
    pub campaign_id: u32,
    pub contributor: Address,
    pub amount: i128,
    pub timestamp: u64,
}

fn treasury_deposit(env: &Env, treasury: &Address, campaign_id: u32, amount: i128) {
    let mut args: Vec<Val> = Vec::new(env);
    args.push_back((campaign_id as u32).into_val(env));
    args.push_back(amount.into_val(env));
    let _: Val = env.invoke_contract(treasury, &Symbol::new(env, "deposit"), args);
}

fn treasury_withdraw(env: &Env, treasury: &Address, campaign_id: u32, amount: i128) {
    let mut args: Vec<Val> = Vec::new(env);
    args.push_back((campaign_id as u32).into_val(env));
    args.push_back(amount.into_val(env));
    let _: Val = env.invoke_contract(treasury, &Symbol::new(env, "withdraw"), args);
}



fn save_campaign(env: &Env, id: u32, campaign: &CampaignData) {
    let key = DataKey::Campaign(id);
    env.storage().persistent().set(&key, campaign);
    env.storage().persistent().extend_ttl(&key, 100, 1000);
}

fn load_campaign(env: &Env, id: u32) -> CampaignData {
    let key = DataKey::Campaign(id);
    env.storage()
        .persistent()
        .get(&key)
        .unwrap_or_else(|| panic_with_error!(env, ContractError::CampaignNotFound))
}

fn save_donations(env: &Env, id: u32, donations: &Vec<DonationRecord>) {
    let key = DataKey::Donations(id);
    env.storage().persistent().set(&key, donations);
    env.storage().persistent().extend_ttl(&key, 100, 1000);
}

fn load_donations(env: &Env, id: u32) -> Vec<DonationRecord> {
    let key = DataKey::Donations(id);
    env.storage()
        .persistent()
        .get(&key)
        .unwrap_or_else(|| Vec::new(env))
}

fn save_contributors(env: &Env, id: u32, contributors: &Vec<Address>) {
    let key = DataKey::Contributors(id);
    env.storage().persistent().set(&key, contributors);
    env.storage().persistent().extend_ttl(&key, 100, 1000);
}

fn load_contributors(env: &Env, id: u32) -> Vec<Address> {
    let key = DataKey::Contributors(id);
    env.storage()
        .persistent()
        .get(&key)
        .unwrap_or_else(|| Vec::new(env))
}

fn save_contributor_balance(env: &Env, campaign_id: u32, contributor: &Address, amount: i128) {
    let key = DataKey::Contributor(campaign_id, contributor.clone());
    env.storage().persistent().set(&key, &amount);
    env.storage().persistent().extend_ttl(&key, 100, 1000);
}

fn load_contributor_balance(env: &Env, campaign_id: u32, contributor: &Address) -> i128 {
    let key = DataKey::Contributor(campaign_id, contributor.clone());
    env.storage().persistent().get(&key).unwrap_or(0)
}

fn get_next_campaign_id(env: &Env) -> u32 {
    let count = env
        .storage()
        .persistent()
        .get(&DataKey::CampaignCount)
        .unwrap_or(0u32);
    let next_id = count + 1;
    env.storage().persistent().set(&DataKey::CampaignCount, &next_id);
    env.storage()
        .persistent()
        .extend_ttl(&DataKey::CampaignCount, 100, 1000);
    next_id
}

fn get_treasury_address(env: &Env) -> Address {
    env.storage()
        .persistent()
        .get(&DataKey::TreasuryAddress)
        .unwrap_or_else(|| panic_with_error!(env, ContractError::NotInitialized))
}

#[contractimpl]
impl CrowdfundingContract {
    pub fn initialize(env: Env, treasury_address: Address) {
        if env.storage().persistent().has(&DataKey::Initialized) {
            panic_with_error!(&env, ContractError::AlreadyInitialized);
        }
        env.storage().persistent().set(&DataKey::Initialized, &true);
        env.storage().persistent().set(&DataKey::CampaignCount, &0u32);
        env.storage().persistent().set(&DataKey::TreasuryAddress, &treasury_address);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::Initialized, 100, 1000);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::CampaignCount, 100, 1000);
        env.storage()
            .persistent()
            .extend_ttl(&DataKey::TreasuryAddress, 100, 1000);
    }

    pub fn create_campaign(
        env: Env,
        owner: Address,
        name: String,
        description: String,
        funding_goal: i128,
        deadline: u64,
    ) -> u32 {
        if funding_goal <= 0 {
            panic_with_error!(&env, ContractError::InvalidGoal);
        }

        owner.require_auth();

        let timestamp = env.ledger().timestamp();

        if deadline <= timestamp {
            panic_with_error!(&env, ContractError::InvalidGoal);
        }

        let campaign_id = get_next_campaign_id(&env);

        let campaign = CampaignData {
            id: campaign_id,
            owner: owner.clone(),
            name,
            description,
            funding_goal,
            total_raised: 0,
            contributor_count: 0,
            created_at: timestamp,
            deadline,
            status: CampaignStatus::Active,
        };

        save_campaign(&env, campaign_id, &campaign);
        save_donations(&env, campaign_id, &Vec::new(&env));
        save_contributors(&env, campaign_id, &Vec::new(&env));

        CampaignCreatedEvent {
            owner,
            campaign_id,
            name: campaign.name.clone(),
            funding_goal,
            deadline,
            timestamp,
        }
        .publish(&env);

        campaign_id
    }

    pub fn donate(env: Env, campaign_id: u32, donor: Address, amount: i128) {
        if amount <= 0 {
            panic_with_error!(&env, ContractError::InvalidAmount);
        }

        donor.require_auth();

        let mut campaign = load_campaign(&env, campaign_id);
        let timestamp = env.ledger().timestamp();

        if campaign.status != CampaignStatus::Active {
            panic_with_error!(&env, ContractError::CampaignClosed);
        }

        if timestamp > campaign.deadline {
            campaign.status = CampaignStatus::Failed;
            save_campaign(&env, campaign_id, &campaign);
            panic_with_error!(&env, ContractError::CampaignExpired);
        }

        let treasury_address = get_treasury_address(&env);
        treasury_deposit(&env, &treasury_address, campaign_id, amount);

        let mut donations = load_donations(&env, campaign_id);
        let mut contributors = load_contributors(&env, campaign_id);
        let mut is_new_contributor = true;

        for contributor in contributors.iter() {
            if contributor == donor {
                is_new_contributor = false;
                break;
            }
        }

        donations.push_back(DonationRecord {
            campaign_id,
            donor: donor.clone(),
            amount,
            timestamp,
        });

        if is_new_contributor {
            contributors.push_back(donor.clone());
        }

        let current_contrib = load_contributor_balance(&env, campaign_id, &donor);
        save_contributor_balance(&env, campaign_id, &donor, current_contrib + amount);

        campaign.total_raised += amount;
        campaign.contributor_count = contributors.len();

        save_campaign(&env, campaign_id, &campaign);
        save_donations(&env, campaign_id, &donations);
        save_contributors(&env, campaign_id, &contributors);

        DonationReceivedEvent {
            campaign_id,
            donor,
            amount,
            timestamp,
        }
        .publish(&env);
    }

    pub fn withdraw_funds(env: Env, campaign_id: u32) {
        let campaign = load_campaign(&env, campaign_id);
        campaign.owner.require_auth();

        let timestamp = env.ledger().timestamp();

        let effective_status = if campaign.status == CampaignStatus::Active
            && timestamp > campaign.deadline
        {
            if campaign.total_raised >= campaign.funding_goal {
                CampaignStatus::Successful
            } else {
                CampaignStatus::Failed
            }
        } else {
            campaign.status.clone()
        };

        if effective_status != CampaignStatus::Successful && timestamp <= campaign.deadline {
            panic_with_error!(&env, ContractError::CampaignNotSuccessful);
        }

        let treasury_address = get_treasury_address(&env);
        let balance = campaign.total_raised;
        if balance <= 0 {
            panic_with_error!(&env, ContractError::WithdrawFailed);
        }

        treasury_withdraw(&env, &treasury_address, campaign_id, balance);


        let mut updated_campaign = campaign;
        updated_campaign.status = CampaignStatus::Closed;
        save_campaign(&env, campaign_id, &updated_campaign);

        FundsWithdrawnEvent {
            campaign_id,
            owner: updated_campaign.owner.clone(),
            amount: balance,
            timestamp,
        }
        .publish(&env);
    }

    pub fn refund(env: Env, campaign_id: u32, contributor: Address) {
        contributor.require_auth();

        let campaign = load_campaign(&env, campaign_id);
        let timestamp = env.ledger().timestamp();

        let effective_status = if timestamp > campaign.deadline
            && campaign.total_raised < campaign.funding_goal
        {
            CampaignStatus::Failed
        } else {
            campaign.status.clone()
        };

        if effective_status != CampaignStatus::Failed
            && effective_status != CampaignStatus::Closed
        {
            panic_with_error!(&env, ContractError::CampaignNotFailed);
        }

        let contrib_amount = load_contributor_balance(&env, campaign_id, &contributor);
        if contrib_amount <= 0 {
            panic_with_error!(&env, ContractError::AlreadyRefunded);
        }

        let treasury_address = get_treasury_address(&env);
        treasury_withdraw(&env, &treasury_address, campaign_id, contrib_amount);

        save_contributor_balance(&env, campaign_id, &contributor, 0);

        let mut updated_campaign = campaign;
        updated_campaign.total_raised -= contrib_amount;
        save_campaign(&env, campaign_id, &updated_campaign);

        RefundIssuedEvent {
            campaign_id,
            contributor,
            amount: contrib_amount,
            timestamp,
        }
        .publish(&env);
    }

    pub fn close_campaign(env: Env, campaign_id: u32) {
        let mut campaign = load_campaign(&env, campaign_id);
        campaign.owner.require_auth();

        if campaign.status != CampaignStatus::Active {
            panic_with_error!(&env, ContractError::CampaignClosed);
        }

        let timestamp = env.ledger().timestamp();
        let new_status;

        if timestamp > campaign.deadline {
            if campaign.total_raised >= campaign.funding_goal {
                new_status = CampaignStatus::Successful;
            } else {
                new_status = CampaignStatus::Failed;
            }
        } else {
            new_status = CampaignStatus::Closed;
        }

        campaign.status = new_status.clone();
        save_campaign(&env, campaign_id, &campaign);

        CampaignClosedEvent {
            campaign_id,
            status: new_status,
            timestamp,
        }
        .publish(&env);
    }

    pub fn get_campaign(env: Env, campaign_id: u32) -> CampaignData {
        load_campaign(&env, campaign_id)
    }

    pub fn get_contributor(env: Env, campaign_id: u32, contributor: Address) -> i128 {
        load_contributor_balance(&env, campaign_id, &contributor)
    }

    pub fn get_all_campaigns(env: Env) -> Vec<CampaignData> {
        let count: u32 = env
            .storage()
            .persistent()
            .get(&DataKey::CampaignCount)
            .unwrap_or(0);

        let mut campaigns = Vec::new(&env);
        let mut i: u32 = 1;
        while i <= count {
            if env.storage().persistent().has(&DataKey::Campaign(i)) {
                let campaign: CampaignData = env
                    .storage()
                    .persistent()
                    .get(&DataKey::Campaign(i))
                    .unwrap();
                campaigns.push_back(campaign);
            }
            i += 1;
        }
        campaigns
    }

    pub fn get_recent_donations(env: Env, campaign_id: u32, limit: u32) -> Vec<DonationRecord> {
        let donations = load_donations(&env, campaign_id);
        let total = donations.len();

        if limit == 0 || total == 0 {
            return Vec::new(&env);
        }

        let start = if total > limit { total - limit } else { 0 };
        let mut recent = Vec::new(&env);

        let mut index = start;
        while index < total {
            recent.push_back(donations.get(index).unwrap());
            index += 1;
        }

        recent
    }

    pub fn get_contributors(env: Env, campaign_id: u32) -> Vec<Address> {
        load_contributors(&env, campaign_id)
    }
}

#[cfg(test)]
mod test;
