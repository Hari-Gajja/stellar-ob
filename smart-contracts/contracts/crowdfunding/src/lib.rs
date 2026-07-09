#![no_std]

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, panic_with_error, Address,
    Env, String, Vec,
};

#[contract]
pub struct CrowdfundingContract;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CampaignData {
    pub name: String,
    pub description: String,
    pub funding_goal: i128,
    pub total_raised: i128,
    pub contributor_count: u32,
    pub owner: Address,
    pub created_at: u64,
    pub goal_reached: bool,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DonationRecord {
    pub donor: Address,
    pub amount: i128,
    pub timestamp: u64,
    pub transaction_id: String,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Campaign,
    Donations,
    Contributors,
    Initialized,
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
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CampaignInitializedEvent {
    pub owner: Address,
    pub name: String,
    pub funding_goal: i128,
    pub timestamp: u64,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DonationReceivedEvent {
    pub donor: Address,
    pub amount: i128,
    pub timestamp: u64,
    pub transaction_id: String,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CampaignGoalReachedEvent {
    pub total_raised: i128,
    pub funding_goal: i128,
    pub timestamp: u64,
}

fn load_campaign(env: &Env) -> CampaignData {
    env.storage()
        .persistent()
        .get(&DataKey::Campaign)
        .unwrap_or_else(|| panic_with_error!(env, ContractError::NotInitialized))
}

fn save_campaign(env: &Env, campaign: &CampaignData) {
    env.storage().persistent().set(&DataKey::Campaign, campaign);
    env.storage().persistent().extend_ttl(&DataKey::Campaign, 100, 1000);
}

fn load_donations(env: &Env) -> Vec<DonationRecord> {
    env.storage()
        .persistent()
        .get(&DataKey::Donations)
        .unwrap_or_else(|| Vec::new(env))
}

fn save_donations(env: &Env, donations: &Vec<DonationRecord>) {
    env.storage().persistent().set(&DataKey::Donations, donations);
    env.storage()
        .persistent()
        .extend_ttl(&DataKey::Donations, 100, 1000);
}

fn load_contributors(env: &Env) -> Vec<String> {
    env.storage()
        .persistent()
        .get(&DataKey::Contributors)
        .unwrap_or_else(|| Vec::new(env))
}

fn save_contributors(env: &Env, contributors: &Vec<String>) {
    env.storage().persistent().set(&DataKey::Contributors, contributors);
    env.storage()
        .persistent()
        .extend_ttl(&DataKey::Contributors, 100, 1000);
}

#[contractimpl]
impl CrowdfundingContract {
    pub fn initialize_campaign(
        env: Env,
        owner: Address,
        name: String,
        description: String,
        funding_goal: i128,
    ) {
        if env.storage().persistent().has(&DataKey::Initialized) {
            panic_with_error!(&env, ContractError::AlreadyInitialized);
        }

        if funding_goal <= 0 {
            panic_with_error!(&env, ContractError::InvalidGoal);
        }

        owner.require_auth();

        let timestamp = env.ledger().timestamp();
        let campaign = CampaignData {
            name,
            description,
            funding_goal,
            total_raised: 0,
            contributor_count: 0,
            owner: owner.clone(),
            created_at: timestamp,
            goal_reached: false,
        };

        env.storage().persistent().set(&DataKey::Initialized, &true);
        save_campaign(&env, &campaign);
        save_donations(&env, &Vec::new(&env));
        save_contributors(&env, &Vec::new(&env));

        CampaignInitializedEvent {
            owner,
            name: campaign.name.clone(),
            funding_goal,
            timestamp,
        }
        .publish(&env);
    }

    pub fn donate(
        env: Env,
        donor: Address,
        amount: i128,
        transaction_id: String,
    ) {
        if amount <= 0 {
            panic_with_error!(&env, ContractError::InvalidAmount);
        }

        donor.require_auth();

        let mut campaign = load_campaign(&env);
        let timestamp = env.ledger().timestamp();

        let mut donations = load_donations(&env);
        let mut contributors = load_contributors(&env);
        let donor_key = donor.to_string();

        let mut is_new_contributor = true;
        for contributor in contributors.iter() {
            if contributor == donor_key {
                is_new_contributor = false;
                break;
            }
        }

        donations.push_back(DonationRecord {
            donor: donor.clone(),
            amount,
            timestamp,
            transaction_id: transaction_id.clone(),
        });

        if is_new_contributor {
            contributors.push_back(donor_key);
        }

        campaign.total_raised += amount;
        campaign.contributor_count = contributors.len();

        let goal_reached = !campaign.goal_reached && campaign.total_raised >= campaign.funding_goal;
        if goal_reached {
            campaign.goal_reached = true;
        }

        save_campaign(&env, &campaign);
        save_donations(&env, &donations);
        save_contributors(&env, &contributors);

        DonationReceivedEvent {
            donor: donor.clone(),
            amount,
            timestamp,
            transaction_id,
        }
        .publish(&env);

        if goal_reached {
            CampaignGoalReachedEvent {
                total_raised: campaign.total_raised,
                funding_goal: campaign.funding_goal,
                timestamp,
            }
            .publish(&env);
        }
    }

    pub fn get_campaign(env: Env) -> CampaignData {
        load_campaign(&env)
    }

    pub fn get_total(env: Env) -> i128 {
        load_campaign(&env).total_raised
    }

    pub fn get_contributor_count(env: Env) -> u32 {
        load_campaign(&env).contributor_count
    }

    pub fn get_recent_donations(env: Env, limit: u32) -> Vec<DonationRecord> {
        let donations = load_donations(&env);
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
}

mod test;