
import { sleep, TESTOR } from './common.js'
import { test_call } from './call_test.js';
import { airdrop } from './airdrop.js';
import { e_commerce } from './e-commerce.js';
import { Account, call_demand_json, call_guard, call_guard_json, call_permission, call_permission_json, call_personal, call_personal_json, call_repository_json, call_service, call_service_json, call_treasury_json, CallArbitrationSchemaInput, CallGuard_Data, CallGuardObject, CallPermissionObject, CallService, CallService_Data, CallServiceObject, local_mark_operation, query_local_mark_list, query_objects, query_objects_json, query_personal, query_personal_json, WOWOK } from 'wowok_agent';

const main = async () => {
    let acc = await Account.Instance().default();
    if (!acc) {
        acc = await Account.Instance().gen();

    }

    console.log(await Account.Instance().list());

    if (!acc) {
        console.error('default account error!');
        return;
    } else {
        console.log('default account: '+ acc.address);
    }
    
    await Account.Instance().faucet(acc.address); 
    
    await test_call()
    await airdrop();
    await e_commerce(); 
  }  

main().catch(console.error)