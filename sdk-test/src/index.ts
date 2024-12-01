
import { Protocol, ENTRYPOINT, TxbObject, RpcResultParser, GuardParser, Wowok, } from 'wowok';
import { TEST_PRIV, TEST_ADDR } from './common'
import { test_permission_launch, test_permission_set_guard } from './permission_test'
import { test_guard_launch_permission_builder, test_guard_launch_everyone, test_guard_launch_substring,
    test_guard_launch_number, test_guard_launch_creator_equal, test_constant_launch_creator_equal, 
    test_guard_passport, test_guard_future_object, test_guard_to_object, test_guard_true, passport_query} from './gurad_test'
import { test_repository_launch, test_repository_policy } from './repository_test'
import { test_machine_edit_nodes, test_machine_launch, test_machine_progress, test_progress_run1, test_progress_run2 } from './machine_test';
import { test_service_launch, test_service_order, test_service_withdraw } from './service_test';
import { test_demand_launch, test_demand_yes } from './demand_test';
import { create_my_resource, manage_my_resource, like, avatar, transfer_resource,  destroy_resource } from './personal_test'

const main = async () => {
    let protocol = new Protocol(ENTRYPOINT.testnet)
    await test_exes(protocol);
    //await test_future_objects(protocol)
    //await test_personal(protocol, ''); // old resource id
}  

const sleep = (ms: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const test_personal = async (protocol:Protocol, old_personal_resource:string) => {
    if (old_personal_resource) {
        RpcResultParser.objectids_from_response(protocol, await protocol.SignExcute([destroy_resource], TEST_PRIV(), old_personal_resource));
    }

    let ids = new Map<string, TxbObject[]>();
    RpcResultParser.objectids_from_response(protocol, await protocol.SignExcute([create_my_resource], TEST_PRIV(), ids), ids);
    console.log('resource id: ' + ids.get('resource::Resource'));
    RpcResultParser.objectids_from_response(protocol, await protocol.SignExcute([manage_my_resource], TEST_PRIV(), ids), ids);
    RpcResultParser.objectids_from_response(protocol, await protocol.SignExcute([like, avatar], TEST_PRIV(), ids), ids);
}

const test_future_objects = async (protocol:Protocol) => {
    let ids = new Map<string, string[]>();
    RpcResultParser.objectids_from_response(protocol, await protocol.SignExcute([test_permission_launch], TEST_PRIV(), ids), ids);
    console.log('permission id: ' + ids.get('permission::Permission')); await sleep(3000)
    RpcResultParser.objectids_from_response(protocol, await protocol.SignExcute([test_permission_launch], TEST_PRIV(), ids), ids);
    console.log('permission id: ' + ids.get('permission::Permission')); await sleep(3000)
    // object random sequence by rpc-get-objects !!  
    RpcResultParser.objectids_from_response(protocol, await protocol.SignExcute(
        [test_machine_launch], TEST_PRIV(), ids), ids);
    console.log('machine id: ' + ids.get('machine::Machine')); await sleep(1000)
    RpcResultParser.objectids_from_response(protocol, await protocol.SignExcute(
        [test_machine_progress], TEST_PRIV(), ids), ids);
    console.log('progress id: ' + ids.get('progress::Progress')); await sleep(1000)
    RpcResultParser.objectids_from_response(protocol, await protocol.SignExcute(
        [test_guard_future_object], TEST_PRIV(), ids), ids);
    console.log('guard id: ' + ids.get('guard::Guard')); await sleep(6000);
    const query = await passport_query(ids);
    RpcResultParser.objectids_from_response(protocol, await protocol.SignExcute(
        [test_guard_passport], TEST_PRIV(), query), ids);
    console.log(ids); 
//    test_guard_to_object(protocol, ids);
}
/*
const test_guard_queries = async (protocol:Protocol) => {
    let ids = new Map<string, TxbObject[]>();
    RpcResultParser.objectids_from_response(protocol, await protocol.SignExcute([test_permission_launch, test_permission_launch], TEST_PRIV()), ids);
    console.log('permission id: ' + ids.get('permission::Permission'));
    RpcResultParser.objectids_from_response(protocol, await protocol.SignExcute([test_guard_launch_creator_equal], TEST_PRIV(), ids), ids);
    console.log('guard id:  ' + ids.get('guard::Guard'))
    await sleep(10000) // wait query effective, important!
    let res = await test_guard_graphql_senses_objects(protocol, ids.get('guard::Guard') as string[]); 
    console.log(res)
} */

const test_exes = async (protocol:Protocol) => {
    let ids = new Map<string, TxbObject[]>();
    RpcResultParser.objectids_from_response(protocol, await protocol.SignExcute([test_permission_launch], TEST_PRIV(), ids), ids); await sleep(2000)
    RpcResultParser.objectids_from_response(protocol, await protocol.SignExcute([test_permission_launch], TEST_PRIV(), ids), ids); await sleep(2000)
    console.log('permission id: ' + ids.get('permission::Permission'));  await sleep(2000);
    // object random sequence by rpc-get-objects !!  
    RpcResultParser.objectids_from_response(protocol, await protocol.SignExcute([test_guard_true], TEST_PRIV(), ids), ids);
    console.log('guard id: ' + ids.get('guard::Guard'));  await sleep(2000);
    RpcResultParser.objectids_from_response(protocol, await protocol.SignExcute([test_constant_launch_creator_equal], TEST_PRIV(), ids), ids);
    console.log('guard id: ' + ids.get('guard::Guard'));  await sleep(2000);
    RpcResultParser.objectids_from_response(protocol, await protocol.SignExcute(
        [test_guard_launch_creator_equal], 
        TEST_PRIV(), ids), ids);
    console.log('guard id: ' + ids.get('guard::Guard'));  await sleep(2000);
    RpcResultParser.objectids_from_response(protocol, await protocol.SignExcute(
        [test_permission_set_guard, test_guard_launch_number, test_guard_launch_permission_builder], TEST_PRIV(), ids), ids);     await sleep(2000); 
    RpcResultParser.objectids_from_response(protocol, await protocol.SignExcute([test_repository_launch], TEST_PRIV(), ids), ids);  await sleep(2000);
    console.log('repository id: ' + ids.get('repository::Repository'));
    RpcResultParser.objectids_from_response(protocol, await protocol.SignExcute([test_repository_policy], TEST_PRIV(), ids), ids);  await sleep(2000);
    RpcResultParser.objectids_from_response(protocol, await protocol.SignExcute([test_machine_launch], TEST_PRIV(), ids), ids);  await sleep(2000);
    console.log('machine id: ' + ids.get('machine::Machine'));
    RpcResultParser.objectids_from_response(protocol, await protocol.SignExcute(
        [test_machine_edit_nodes, test_machine_progress], TEST_PRIV(), ids), ids);
    console.log('progress id: ' + ids.get('progress::Progress'));  await sleep(2000);
    RpcResultParser.objectids_from_response(protocol, await protocol.SignExcute([test_machine_progress], TEST_PRIV(), ids), ids);  await sleep(2000);
    console.log('progress id: ' + ids.get('progress::Progress'));
    RpcResultParser.objectids_from_response(protocol, await protocol.SignExcute([test_progress_run1], TEST_PRIV(), ids));
    RpcResultParser.objectids_from_response(protocol, await protocol.SignExcute([test_progress_run2], TEST_PRIV(), ids));
    console.log('run progress ready.')

    RpcResultParser.objectids_from_response(protocol, await protocol.SignExcute(
        [test_service_launch, test_demand_launch,  test_service_launch], TEST_PRIV(), ids), ids); await sleep(2000)
    console.log('service id: ' + ids.get('service::Service'))
    console.log('discount id: ' + ids.get('order::Discount'))
    RpcResultParser.objectids_from_response(protocol, await protocol.SignExcute(
        [test_service_order], TEST_PRIV(), ids), ids);
    RpcResultParser.objectids_from_response(protocol, await protocol.SignExcute(
        [test_service_withdraw, test_demand_launch], TEST_PRIV(), ids), ids);  
    console.log('demand id: ' + ids.get('demand::Demand'));
    RpcResultParser.objectids_from_response(protocol, await protocol.SignExcute(
        [test_demand_yes], TEST_PRIV(), ids), ids);
    
    console.log(ids)
}

main().catch(console.error)