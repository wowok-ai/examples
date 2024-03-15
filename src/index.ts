import { SuiClient, SuiObjectResponse } from '@mysten/sui.js/client';
import { TransactionBlock, type TransactionResult } from '@mysten/sui.js/transactions';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { BCS, getSuiMoveConfig, toHEX, fromHEX, BcsReader } from '@mysten/bcs';
import { PROTOCOL, Data_Type, Query_Param} from './protocol/protocol';
import { SENDER_PRIV, permission_test, machine_test, service_test, service_test_order, progress_test, ADDR, guard1_test} from './test';
import { sense_objects_fn, description_fn } from './protocol/guard';
import { query_cmd_fn, Guard_Query_Object } from './protocol/passport';
import { objectids_from_response } from './protocol/util'

const main = async () => {
    await test_guard_sense_objects();
    await test_guard_description();
    await test_exes();
}

const test_guard_description = async () => {
    let param:Query_Param = {objectid:PROTOCOL.EveryoneGuard(), callback:description_fn, data:[]};
    await PROTOCOL.Query([param, param]);
    console.log(param)    
}

const test_guard_sense_objects = async () => {
    let ids = new Map<string, string[]>();
    objectids_from_response(await PROTOCOL.Sign_Excute(permission_test, SENDER_PRIV, PROTOCOL.EveryoneGuard()), ids);
    console.log('permission id: ' + ids.get('permission::Permission'));
    objectids_from_response(await PROTOCOL.Sign_Excute(guard1_test, SENDER_PRIV, ids), ids);
    console.log('guard id: ' + ids.get('guard::Guard')); 
    let param1:Query_Param = {objectid:(ids.get('guard::Guard') as string[])[0], callback:sense_objects_fn, data:[]};
    let param2:Query_Param = {objectid:(ids.get('guard::Guard') as string[])[1], callback:sense_objects_fn, data:[]};
    let r3 = await PROTOCOL.Query([param1, param2]);
    console.log(param1)
    console.log(param2)
}

const test_exes = async () => {
    let ids = new Map<string, string[]>();
    objectids_from_response(await PROTOCOL.Sign_Excute(permission_test, SENDER_PRIV, PROTOCOL.EveryoneGuard()), ids);
    console.log('permission id: ' + ids.get('permission::Permission'));
    objectids_from_response(await PROTOCOL.Sign_Excute(machine_test, SENDER_PRIV, ids), ids);
    console.log('machine id: ' + ids.get('machine::Machine'));
    objectids_from_response(await PROTOCOL.Sign_Excute(service_test, SENDER_PRIV, ids), ids);
    console.log('service id: ' + ids.get('service::Service'));
    console.log('discount id: ' + ids.get('order::Discount'));
    objectids_from_response(await PROTOCOL.Sign_Excute(service_test_order, SENDER_PRIV, ids), ids) ;
    console.log('order id: ' + ids.get('order::Order'));
    console.log('progress id: ' + ids.get('progress::Progress'));
    let resp1 = await PROTOCOL.Sign_Excute(progress_test, SENDER_PRIV, ids);
    console.log(resp1);
}

main().catch(console.error)