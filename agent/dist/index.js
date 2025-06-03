import { Account, call_service_json } from 'wowok_agent';
const main = async () => {
    var acc = await Account.Instance().default();
    if (!acc) {
        acc = await Account.Instance().gen(true);
    }
    if (!acc) {
        console.error('default account error!');
        return;
    }
    else {
        console.log('default account: ' + acc.address);
    }
    const data = `{
  "data": {
    "type_parameter": "0x2::sui::SUI",
    "object": {
      "address": "0x992a3e00fd2d7d83a766e82bdfbd512f2b786ec52a0d67b06ad5988ce0c529bb"
    },
    "order_new": {
      "buy_items": [
        {
          "item": "Traveling Iceland",
          "max_price": 10000,
          "count": 1
        }
      ],
      "machine": "0xae590b273bff608bc14760fcc0ed3fc5034f46844eea19e1c3116ce34889a6d0"
    }
  },
  "account": "buyer"
}`;
    console.log(JSON.parse(data));
    console.log(await call_service_json(data));
    //await Account.Instance().faucet(acc.address);
    //await test_call()
    //await airdrop();
    //await e_commerce();
};
main().catch(console.error);
