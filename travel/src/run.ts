
import { sleep, PAY_TYPE, PUBKEY, result, check_account, BUYER_ACCOUNT, TRAVEL_PRODUCT, INSURANCE_PRODUCT, launch_order, GUARDS, GUARDS_NAME, ServiceReturn,  } from './common'
import { Account, call_machine, CallMachine, CallMachine_Data, CallService_Data, GuardInfo_forCall, LocalMark } from 'wowok_agent';
import { travel, TRAVEL_MACHINE_NODE } from './service_travel';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

export const run_service = async (insurance_service:ServiceReturn, traval_service:ServiceReturn) => {    
    console.log(insurance_service)
    console.log(traval_service)

    // buy traveling service
    const NodeRSA = require('node-rsa');
    const rsa = new NodeRSA(PUBKEY);
    const info = rsa.encrypt('address: ...; phone: ...;', 'base64'); // your infomation 
    console.log('crypto info:' + info);

    const buy : CallService_Data = { object:{address:traval_service.service}, type_parameter:PAY_TYPE, 
        permission:{address:traval_service.permission},
        order_new:{buy_items:[{item:TRAVEL_PRODUCT.item, max_price:TRAVEL_PRODUCT.price, count:'1'}], 
            customer_info_crypto:{customer_pubkey:PUBKEY, customer_info_crypt:info},namedNewOrder:{name:'travel order'}, 
            namedNewProgress:{name:'travel progress'}, machine:traval_service.machine},
        order_payer:{payer_new:(await Account.Instance().get(BUYER_ACCOUNT))?.address!} // change payer to user
    }

    const travel = await launch_order(buy, BUYER_ACCOUNT);
    console.log('travel order:' + travel?.order + ' progress: ' + travel?.progress);

    // run progress
    console.log('progress: ' + TRAVEL_MACHINE_NODE.Insurance)
    const buy_insurance : CallService_Data = { object:{address:insurance_service.service}, type_parameter:PAY_TYPE,
        permission:{address:insurance_service.permission},
        order_new:{buy_items:[{item:INSURANCE_PRODUCT.item, max_price:INSURANCE_PRODUCT.price, count:'1'}], 
            customer_info_crypto:{customer_pubkey:PUBKEY, customer_info_crypt:info}, namedNewOrder:{name:'insurance order'}, 
            namedNewProgress:{name:'insurance progress'}, machine:insurance_service.machine}
    }
    const ins = await launch_order(buy_insurance);
    if (!ins?.order || !ins.progress) {
        console.log('purchase insurance fail.')
        return
    }
    console.log('insurance order:' + ins?.order + ' progress: ' + ins?.progress);

    const progress_insurance : CallMachine_Data = { object:{address:traval_service.machine}, permission:{address:traval_service.permission},
        progress_next:{progress:travel?.progress!, operation:{next_node_name:TRAVEL_MACHINE_NODE.Insurance, forward:'Purchase'}, deliverable:{msg:'purchase success!',
            orders:[{object:ins.order!, pay_token_type:PAY_TYPE}], 
        }}
    }
    await result('Progress', await call_machine({data:progress_insurance}));

    console.log('progress start: ' + TRAVEL_MACHINE_NODE.Spa)
    const progress_spa : CallMachine_Data = { object:{address:traval_service.machine}, permission:{address:traval_service.permission},
        progress_next:{progress:travel?.progress!, operation:{next_node_name:TRAVEL_MACHINE_NODE.Spa, forward:'Comfirm'}, 
            deliverable:{msg:'funny', orders:[]}}
    }
    await result('Progress', await call_machine({data:progress_spa, account:BUYER_ACCOUNT}));
    
    console.log('progress start: ' + TRAVEL_MACHINE_NODE.Ice_scooting)
    const progress_ice_scotting : CallMachine_Data = { object:{address:traval_service.machine}, permission:{address:traval_service.permission},
    progress_next:{progress:travel?.progress!, operation:{next_node_name:TRAVEL_MACHINE_NODE.Ice_scooting, forward:'Enter'}, 
        deliverable:{msg:'go go go', orders:[]}}
    }

    await result('Progress', await call_machine({data:progress_ice_scotting}));

    console.log('progress start: ' + TRAVEL_MACHINE_NODE.Complete)
    const progress_complete : CallMachine_Data = { object:{address:traval_service.machine}, permission:{address:traval_service.permission},
    progress_next:{progress:travel?.progress!, operation:{next_node_name:TRAVEL_MACHINE_NODE.Complete, forward:'Complete'}, 
        deliverable:{msg:'happy nice day', orders:[]}}
    }
    const result_witness = await result('Progress', await call_machine({data:progress_complete}));
    console.log(result_witness);
    if (result_witness && (result_witness as any)?.witness) {
        const w = result_witness as GuardInfo_forCall;
        w.witness[0].witness = travel?.progress!;
        const r = await result('Progress', await call_machine({data:progress_complete, witness:w}));
        console.log('call machine with guard witness.');
        console.log(r);
    }

    // NOTICE: 8 hrs later, could pass the Guard !!!
    /*if (typeof(result_witness) !== 'string' && typeof(result_witness) !== 'undefined' && travel?.progress) {
        (result_witness as GuardInfo_forCall).witness.forEach(v => {
            v.witness = travel?.progress; // fill the witness
        })

        await result('Progress', await call_machine({data:progress_complete, witness:result_witness}));
        console.log('progress finally.')
    }*/
}  
