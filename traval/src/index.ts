
import { sleep, PAY_TYPE, PUBKEY, launch, check_account } from './common'
import { Account, CallMachine, CallMachine_Data, CallService_Data } from 'wowok_agent';
import { insurance } from './service_insurance';
import { weather } from './weather';
import { travel } from './service_travel';

const main = async () => {
    await check_account();
    await check_account('buyer');

    // service
    const service_insurance = await insurance();
    const repository_weather = await weather();
    const service = await travel(repository_weather, [service_insurance]);
    return 
    // buy traveling service
    const NodeRSA = require('node-rsa');
    const rsa = new NodeRSA(PUBKEY);
    rsa.setPublicKey(PUBKEY);
    const info = rsa.encrypt('address: ...; phone: ...;', 'base64'); // your infomation 

    const buy : CallService_Data = { object:{address:service}, type_parameter:PAY_TYPE,
        order_new:{buy_items:[{item:'traveling Iceland', max_price:'16', count:'1'}], 
            customer_info_crypto:{customer_pubkey:PUBKEY, customer_info_crypt:info}},
    }
    await launch('Service', buy, 'buyer');
}  

main().catch(console.error)