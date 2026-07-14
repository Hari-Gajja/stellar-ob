#![no_std]

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, panic_with_error, Address, Env,
};

#[contract]
pub struct TreasuryContract;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DataKey {
    Balance(u32),
    Locked(u32),
    Admin,
}

#[contracterror]
#[derive(Clone, Copy, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum TreasuryError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    InsufficientBalance = 3,
    Locked = 4,
    Unauthorized = 5,
    InvalidAmount = 6,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct DepositedEvent {
    pub campaign_id: u32,
    pub amount: i128,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct WithdrawnEvent {
    pub campaign_id: u32,
    pub amount: i128,
}

fn save_balance(env: &Env, campaign_id: u32, balance: i128) {
    let key = DataKey::Balance(campaign_id);
    env.storage().persistent().set(&key, &balance);
    env.storage().persistent().extend_ttl(&key, 100, 1000);
}

fn load_balance(env: &Env, campaign_id: u32) -> i128 {
    let key = DataKey::Balance(campaign_id);
    env.storage().persistent().get(&key).unwrap_or(0)
}

fn save_locked(env: &Env, campaign_id: u32, locked: bool) {
    let key = DataKey::Locked(campaign_id);
    env.storage().persistent().set(&key, &locked);
    env.storage().persistent().extend_ttl(&key, 100, 1000);
}

fn load_locked(env: &Env, campaign_id: u32) -> bool {
    let key = DataKey::Locked(campaign_id);
    env.storage().persistent().get(&key).unwrap_or(false)
}

#[contractimpl]
impl TreasuryContract {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().persistent().has(&DataKey::Admin) {
            panic_with_error!(&env, TreasuryError::AlreadyInitialized);
        }
        env.storage().persistent().set(&DataKey::Admin, &admin);
        env.storage().persistent().extend_ttl(&DataKey::Admin, 100, 1000);
    }

    pub fn deposit(env: Env, campaign_id: u32, amount: i128) {
        if amount <= 0 {
            panic_with_error!(&env, TreasuryError::InvalidAmount);
        }

        let balance = load_balance(&env, campaign_id);
        let new_balance = balance.checked_add(amount)
            .unwrap_or_else(|| panic_with_error!(&env, TreasuryError::InvalidAmount));
        save_balance(&env, campaign_id, new_balance);

        DepositedEvent { campaign_id, amount }.publish(&env);
    }

    pub fn withdraw(env: Env, campaign_id: u32, amount: i128) {
        if amount <= 0 {
            panic_with_error!(&env, TreasuryError::InvalidAmount);
        }

        if load_locked(&env, campaign_id) {
            panic_with_error!(&env, TreasuryError::Locked);
        }

        let balance = load_balance(&env, campaign_id);
        if balance < amount {
            panic_with_error!(&env, TreasuryError::InsufficientBalance);
        }

        let new_balance = balance.checked_sub(amount)
            .unwrap_or_else(|| panic_with_error!(&env, TreasuryError::InsufficientBalance));
        save_balance(&env, campaign_id, new_balance);

        WithdrawnEvent { campaign_id, amount }.publish(&env);
    }

    pub fn lock(env: Env, admin: Address, campaign_id: u32) {
        admin.require_auth();
        let stored_admin: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic_with_error!(&env, TreasuryError::NotInitialized));
        if admin != stored_admin {
            panic_with_error!(&env, TreasuryError::Unauthorized);
        }
        save_locked(&env, campaign_id, true);
    }

    pub fn unlock(env: Env, admin: Address, campaign_id: u32) {
        admin.require_auth();
        let stored_admin: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic_with_error!(&env, TreasuryError::NotInitialized));
        if admin != stored_admin {
            panic_with_error!(&env, TreasuryError::Unauthorized);
        }
        save_locked(&env, campaign_id, false);
    }

    pub fn get_balance(env: Env, campaign_id: u32) -> i128 {
        load_balance(&env, campaign_id)
    }

    pub fn get_locked(env: Env, campaign_id: u32) -> bool {
        load_locked(&env, campaign_id)
    }
}

mod test;
