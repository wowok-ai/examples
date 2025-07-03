import { Account, call_permission_json } from 'wowok_agent';
const main = async () => {
    var acc = await Account.Instance().default();
    if (!acc) {
        acc = await Account.Instance().gen();
    }
    console.log(await Account.Instance().list());
    if (!acc) {
        console.error('default account error!');
        return;
    }
    else {
        console.log('default account: ' + acc.address);
    }
    await Account.Instance().faucet(acc.address);
    const data = `{
  "data": {
    "object": "网络创建者",
    "biz_permission": {
      "op": "add",
      "data": [
        {
          "index": 1001,
          "name": "供应商"
        }
      ]
    }
  },
  "account": "0xaf35fd7caf6848d78b11bffec1c96b1e133e4b469b03b9ba452cfaf1a435ddf5"
}`;
    console.log(await call_permission_json(data));
    /*    await test_call()
        await airdrop();
        await e_commerce();*/
};
main().catch(console.error);
