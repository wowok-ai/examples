
import { sleep, PAY_TYPE, PUBKEY, launch, check_account, BUYER_ACCOUNT, TRAVEL_PRODUCT, INSURANCE_PRODUCT, launch_order, GUARDS, GUARDS_NAME,  } from './common'
import { Account, CallMachine, CallMachine_Data, CallService_Data } from 'wowok_agent';
import { insurance, INSURANCE_MACHINE_NODE } from './service_insurance';
import { weather } from './weather';
import { travel, TRAVEL_MACHINE_NODE } from './service_travel';

const main = async () => {
    await check_account();
    await check_account(BUYER_ACCOUNT);

    // service
    const service_insurance = await insurance();
    const repository_weather = await weather();
    const service = await travel(repository_weather, [service_insurance.service]);
    
    // ... Start simulating the main processes for the roles across the service ...
    
    // buy traveling service
    const NodeRSA = require('node-rsa');
    const rsa = new NodeRSA(PUBKEY);
    rsa.setPublicKey(PUBKEY);
    const info = rsa.encrypt('address: ...; phone: ...;', 'base64'); // your infomation 

    const buy : CallService_Data = { object:{address:service.service}, type_parameter:PAY_TYPE,
        order_new:{buy_items:[{item:TRAVEL_PRODUCT.item, max_price:TRAVEL_PRODUCT.price, count:'1'}], 
            customer_info_crypto:{customer_pubkey:PUBKEY, customer_info_crypt:info},namedNewOrder:{name:'travel order'}, 
            namedNewProgress:{name:'travel progress'}, machine:service.machine}
    }
    const traval = await launch_order(buy, BUYER_ACCOUNT);

    // run progress
    const buy_insurance : CallService_Data = { object:{address:service_insurance.service}, type_parameter:PAY_TYPE,
        order_new:{buy_items:[{item:INSURANCE_PRODUCT.item, max_price:INSURANCE_PRODUCT.price, count:'1'}], 
            customer_info_crypto:{customer_pubkey:PUBKEY, customer_info_crypt:info}, namedNewOrder:{name:'insurance order'}, 
            namedNewProgress:{name:'insurance progress'}, machine:service_insurance.machine}
    }
    const ins = await launch_order(buy_insurance);
    if (!ins?.order || !ins.progress) {
        console.log('purchase insurance fail.')
        return
    }

    const progress_insurance : CallMachine_Data = { object:{address:service.machine}, permission:{address:service.permission},
        progress_next:{progress:ins?.progress!, data:{next_node_name:TRAVEL_MACHINE_NODE.Insurance, forward:'Purchase'}, deliverable:{msg:'purchase success!',
            orders:[{object:ins.order!, pay_token_type:PAY_TYPE}], 
        }}
    }
    await launch('Machine', progress_insurance);

    const progress_ice_scotting : CallMachine_Data = { object:{address:service.machine}, permission:{address:service.permission},
    progress_next:{progress:ins?.progress!, data:{next_node_name:TRAVEL_MACHINE_NODE.Ice_scooting, forward:'Enter'}, 
        deliverable:{msg:'go go go', orders:[]}, guard:GUARDS.get(GUARDS_NAME.ice_scooting)}
    }
    await launch('Machine', progress_ice_scotting);

    const progress_complete : CallMachine_Data = { object:{address:service.machine}, permission:{address:service.permission},
    progress_next:{progress:ins?.progress!, data:{next_node_name:TRAVEL_MACHINE_NODE.Complete, forward:'Complete'}, 
        deliverable:{msg:'happy nice day', orders:[]},  guard:GUARDS.get(GUARDS_NAME.complete_ice_scooting)}
    }
    const witness = await launch('Machine', progress_complete);
    console.log(witness);
}  

main().catch(console.error)