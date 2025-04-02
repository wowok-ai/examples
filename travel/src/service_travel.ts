
/**
 * Ice Scooting Service
 * Buy insurance services on behalf of users.
 * Whether the service can be performed depending on weather conditions; If the service cannot be performed due to weather, a full refund will be made.
 */

import { call_arbitration, call_guard, call_machine, call_permission, call_service, CallArbitration_Data, CallGuard_Data, CallMachine_Data, 
    CallPermission_Data, CallRepository_Data, CallService_Data, GuardNode, WOWOK } from 'wowok_agent'
import { sleep, TESTOR, TEST_ADDR, result, PAY_TYPE, PUBKEY, TRAVEL_PRODUCT, ServiceReturn, GUARDS_NAME, GUARDS } from './common';
import { ABSOLUTE_ZERO_DEGREE, Weather, Weather_Condition } from './weather';

enum BUSINESS { // business permission for Permission Object must >= 1000
    insurance = 1000,
    finance = 1001,
    ice_scooting = 1002,
    spa = 1003,
};

export enum TRAVEL_MACHINE_NODE {
    Insurance = 'Purchase insurance',
    Ice_scooting = 'Ice scooting',
    Complete = 'Complete',
    Cancel = 'Cancelled ice scooting',
    Insurance_Fail = 'Insurance purchase failure',
    Spa = 'Accommodation and spa',
}


const Insurance:WOWOK.Machine_Node = {
    name: TRAVEL_MACHINE_NODE.Insurance,
    pairs: [
        {prior_node: WOWOK.Machine.INITIAL_NODE_NAME, threshold:0, forwards:[
        ]},
    ]
}

const Spa:WOWOK.Machine_Node = {
    name: TRAVEL_MACHINE_NODE.Spa,
    pairs: [
        {prior_node: TRAVEL_MACHINE_NODE.Insurance, threshold:0, forwards:[
            {name:'Comfirm', weight: 1, namedOperator:WOWOK.Machine.OPERATOR_ORDER_PAYER},
            {name:'Accommodation and spa', weight: 1, permission:BUSINESS.spa},
        ]},
    ]
}

const Ice_scooting:WOWOK.Machine_Node = {
    name: TRAVEL_MACHINE_NODE.Ice_scooting,
    pairs: [
        {prior_node: TRAVEL_MACHINE_NODE.Spa, threshold:0, forwards:[
            {name:'Comfirm Enter', weight: 1, namedOperator:WOWOK.Machine.OPERATOR_ORDER_PAYER},
        ]},
    ]
}

const Complete:WOWOK.Machine_Node = {
    name: TRAVEL_MACHINE_NODE.Complete,
    pairs: [
        {prior_node: TRAVEL_MACHINE_NODE.Ice_scooting, threshold:0, forwards:[
        ]},
    ]
}

const Cancel:WOWOK.Machine_Node = {
    name: TRAVEL_MACHINE_NODE.Cancel,
    pairs: [
        {prior_node: TRAVEL_MACHINE_NODE.Spa, threshold:0, forwards:[
        ]},
    ]
}

const Insurance_Fail:WOWOK.Machine_Node = {
    name: TRAVEL_MACHINE_NODE.Insurance_Fail,
    pairs: [
        {prior_node:WOWOK.Machine.INITIAL_NODE_NAME, threshold:0, forwards:[
            {name:'Failure to purchase insurance', weight: 1, permission:BUSINESS.insurance},
        ]},
    ]
}

export const travel = async (weather_repository:string, insurance_service:string[]) : Promise<ServiceReturn> => {
    const permission_id = await permission(); await sleep(2000)
    if (!permission_id)  WOWOK.ERROR(WOWOK.Errors.Fail, 'permission object failed.')

    const arbitration_id = await arbitration(); await sleep(2000)
    if (!arbitration_id) WOWOK.ERROR(WOWOK.Errors.Fail, 'arbitration object failed.')

    const machine_id = await machine(permission_id!); await sleep(2000)
    if (!machine_id) WOWOK.ERROR(WOWOK.Errors.Fail, 'machine object failed.')
    await machine_guards_and_publish(machine_id!, permission_id!, weather_repository!, insurance_service); 
    
    const service_id = await service(machine_id!, permission_id!, weather_repository!, arbitration_id!);
    if (!service_id) WOWOK.ERROR(WOWOK.Errors.Fail, 'service object failed.')
    await service_guards_and_publish(machine_id!, permission_id!, service_id!);
    return {machine:machine_id!, service:service_id!, permission:permission_id!}
}

const service = async (machine_id:string, permission_id:string, repository_id:string, arbitraion_id:string) : Promise<string | undefined> => {
    const data: CallService_Data = { permission:{address:permission_id}, type_parameter:PAY_TYPE,
        description:`traveling Iceland. There is a small family company for Local Guide of Vatnsjökull and really stand out in terms of quality.
        Hotel Djúpavík - way out on a dirt road in the Westfjords. Just a quiet family hotel in the middle of nowhere on a fjord. And the hot spring on the beach at Krossnes.
        And ice scooting started the next day.`, machine:machine_id,
        repository:{op:'add', repositories:[repository_id]},
        customer_required_info:{pubkey:PUBKEY, required_info:[
                WOWOK.BuyRequiredEnum.address, WOWOK.BuyRequiredEnum.phone, WOWOK.BuyRequiredEnum.name
            ]}, 
        sales:{op:'add', sales:[TRAVEL_PRODUCT]}, endpoint:'https://x4o43luhbc.feishu.cn/docx/IyA4dUXx1o6ilDxQMMKc3CoonGd?from=from_copylink',
        arbitration:{op:'add', arbitrations:[{address:arbitraion_id, token_type:PAY_TYPE}]}
    }
    return await result('Service', await call_service({data:data})) as string
}

const machine_guards_and_publish = async (machine_id:string, permission_id:string, repository_id:string, insurance_suppliers?:string[]) => {
    await guard_ice_scooting(machine_id, permission_id, repository_id);
    const data : CallMachine_Data = { object:{address:machine_id}, permission:{address:permission_id},
        nodes:{op:'add forward', data:[{prior_node_name:WOWOK.Machine.INITIAL_NODE_NAME, node_name:TRAVEL_MACHINE_NODE.Insurance,
            forward:{name:'Purchase', weight: 1, permission:BUSINESS.insurance, suppliers:insurance_suppliers?.map(v => {return {object:v, pay_token_type:PAY_TYPE, bRequired:false}})}
        }]},
        bPublished:true
    }
    await result('Machine', await call_machine({data:data})) // add new forward to machine
}

const service_guards_and_publish = async (machine_id:string, permission_id:string, service_id:string) => {
    const data_withdraw1 : CallGuard_Data = {namedNew:{},
        description:'Widthdraw for '+service_id,
        table:[{identifier:1, bWitness:true, value_type:WOWOK.ValueType.TYPE_ADDRESS}, // progress witness
            {identifier:2, bWitness:false, value_type:WOWOK.ValueType.TYPE_ADDRESS, value:machine_id} // machine
        ], 
        root: {logic:WOWOK.OperatorType.TYPE_LOGIC_AND, parameters:[ // progress'machine equals this machine
            {logic:WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters:[
                {query:800, object:1, parameters:[]}, // progress.machine
                {identifier:2}
            ]},
            {logic:WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters:[ // current node == order_completed
                {query:801, object:1, parameters:[]}, // 'Current Node'
                {value_type:WOWOK.ValueType.TYPE_STRING, value:TRAVEL_MACHINE_NODE.Complete}
            ]}
        ]}
    };

    const data_withdraw2 : CallGuard_Data = {namedNew:{},
        description:'Widthdraw for '+service_id,
        table:[{identifier:1, bWitness:true, value_type:WOWOK.ValueType.TYPE_ADDRESS}, // progress witness
            {identifier:2, bWitness:false, value_type:WOWOK.ValueType.TYPE_ADDRESS, value:machine_id} // machine
        ], 
        root: {logic:WOWOK.OperatorType.TYPE_LOGIC_AND, parameters:[ // progress'machine equals this machine
            {logic:WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters:[
                {query:800, object:1, parameters:[]}, // progress.machine
                {identifier:2}
            ]},
            {logic:WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters:[ // current node == order_completed
                {query:801, object:1, parameters:[]}, // 'Current Node'
                {value_type:WOWOK.ValueType.TYPE_STRING, value:TRAVEL_MACHINE_NODE.Cancel}
            ]}
        ]}
    };

    const withdraw1 = await result('Guard', await call_guard({data:data_withdraw1})) as string;
    if (!withdraw1) WOWOK.ERROR(WOWOK.Errors.Fail, 'guard_service_withdraw 1');
    const withdraw2 = await result('Guard', await call_guard({data:data_withdraw2})) as string;
    if (!withdraw2) WOWOK.ERROR(WOWOK.Errors.Fail, 'guard_service_withdraw 2');

    const data_refund1 : CallGuard_Data = {namedNew:{},
        description:'Refund for '+service_id,
        table:[{identifier:1, bWitness:true, value_type:WOWOK.ValueType.TYPE_ADDRESS}, // progress witness
            {identifier:2, bWitness:false, value_type:WOWOK.ValueType.TYPE_ADDRESS, value:machine_id} // machine
        ], 
        root: {logic:WOWOK.OperatorType.TYPE_LOGIC_AND, parameters:[ // progress'machine equals this machine
            {logic:WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters:[
                {query:800, object:1, parameters:[]}, // progress.machine
                {identifier:2}
            ]},
            {logic:WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters:[ // current node == order_completed
                {query:801, object:1, parameters:[]}, // 'Current Node'
                {value_type:WOWOK.ValueType.TYPE_STRING, value:TRAVEL_MACHINE_NODE.Insurance_Fail}
            ]}
        ]}
    };
    const data_refund2 : CallGuard_Data = {namedNew:{},
        description:'Refund for '+service_id,
        table:[{identifier:1, bWitness:true, value_type:WOWOK.ValueType.TYPE_ADDRESS}, // progress witness
            {identifier:2, bWitness:false, value_type:WOWOK.ValueType.TYPE_ADDRESS, value:machine_id} // machine
        ], 
        root: {logic:WOWOK.OperatorType.TYPE_LOGIC_AND, parameters:[ // progress'machine equals this machine
            {logic:WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters:[
                {query:800, object:1, parameters:[]}, // progress.machine
                {identifier:2}
            ]},
            {logic:WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters:[ // current node == order_completed
                {query:801, object:1, parameters:[]}, // 'Current Node'
                {value_type:WOWOK.ValueType.TYPE_STRING, value:TRAVEL_MACHINE_NODE.Cancel}
            ]}
        ]}
    };

    const refund1 = await result('Guard', await call_guard({data:data_refund1})) as string;
    if (!refund1) WOWOK.ERROR(WOWOK.Errors.Fail, 'guard_service_refund 1');
    const refund2 = await result('Guard', await call_guard({data:data_refund2})) as string;
    if (!refund2) WOWOK.ERROR(WOWOK.Errors.Fail, 'guard_service_refund 2');

    const data2 : CallService_Data = { object:{address:service_id}, permission:{address:permission_id}, type_parameter:PAY_TYPE,
        withdraw_guard:{op:'add', guards:[{guard:withdraw1!, percent:100},{guard:withdraw2!, percent:60},]}, 
        refund_guard:{op:'add', guards:[{guard:refund1!, percent:100},{guard:refund2!, percent:40},]}, 
        bPublished:true
    }
    await result('Service', await call_service({data:data2}))
}

const guard_ice_scooting = async (machine_id:string, permission_id:string, weather_repository:string) => {
    const weather_cond:GuardNode = { query: 115, object:weather_repository, parameters: [
        {calc:WOWOK.OperatorType.TYPE_NUMBER_ADDRESS, parameters:[ // Align by the start time of each day
            {calc:WOWOK.OperatorType.TYPE_NUMBER_MULTIPLY, parameters:[
                {calc:WOWOK.OperatorType.TYPE_NUMBER_DEVIDE, parameters:[
                    {context:WOWOK.ContextType.TYPE_CLOCK},
                    {value:24*60*60*1000, value_type:WOWOK.ValueType.TYPE_U64} // 1 day
                ]},
                {value:24*60*60*1000, value_type:WOWOK.ValueType.TYPE_U64} 
            ]}
        ]},
        {value:Weather.Ice_scooting_suitable, value_type:WOWOK.ValueType.TYPE_STRING}
    ]};

    const data : CallGuard_Data = {
        description:'Determine if the weather conditions are suitable for ice scooter events',
        root: weather_cond
    };
    const guard_id = await result('Guard', await call_guard({data:data})) as string;
    if (!guard_id) WOWOK.ERROR(WOWOK.Errors.Fail, 'guard_ice_scooting');

    const data2 : CallGuard_Data = {
        description:'Determine if the weather conditions are suitable for ice scooter events',
        root: {logic: WOWOK.OperatorType.TYPE_LOGIC_NOT, parameters:[
            weather_cond
        ]}
    };
    const guard_id2 = await result('Guard', await call_guard({data:data2})) as string;
    if (!guard_id2) WOWOK.ERROR(WOWOK.Errors.Fail, 'guard_ice_scooting 2');

    //{name:'Complete', weight: 1, permission:BUSINESS.ice_scooting},
    const data3 : CallGuard_Data = {
        description:'8 hours project time completed',
        table:[{identifier:1, value_type:WOWOK.ValueType.TYPE_ADDRESS, bWitness:true}],
        root: {logic:WOWOK.OperatorType.TYPE_LOGIC_AND, parameters:[
            {logic: WOWOK.OperatorType.TYPE_LOGIC_AS_U256_GREATER, parameters:[
                { context:WOWOK.ContextType.TYPE_CLOCK},
                { calc: WOWOK.OperatorType.TYPE_NUMBER_ADD, parameters:[ 
                    {query:810, object:1, parameters:[]},
                    {value:8*60*60*1000, value_type:WOWOK.ValueType.TYPE_U64}
                ]}
            ]},
            {logic:WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters:[
                {query:800, object:1, parameters:[]},
                {value:machine_id, value_type:WOWOK.ValueType.TYPE_ADDRESS}
            ]}
        ]}
    };
    const guard_id3 = await result('Guard', await call_guard({data:data3}))  as string;
    if (!guard_id3) WOWOK.ERROR(WOWOK.Errors.Fail, 'guard_ice_scooting 3');

    const data4 : CallMachine_Data = { object:{address:machine_id}, permission:{address:permission_id},
        nodes:{op:'add forward', data:[{prior_node_name:TRAVEL_MACHINE_NODE.Spa, node_name:TRAVEL_MACHINE_NODE.Ice_scooting,
            forward:{name:'Enter', weight: 1, permission:BUSINESS.ice_scooting, guard:guard_id}
        }, 
        {prior_node_name:TRAVEL_MACHINE_NODE.Spa, node_name:TRAVEL_MACHINE_NODE.Cancel,
            forward:{name:'Weather not suitable', weight: 1, permission:BUSINESS.ice_scooting, guard:guard_id2}
        },
        {prior_node_name:TRAVEL_MACHINE_NODE.Ice_scooting, node_name:TRAVEL_MACHINE_NODE.Complete,
            forward:{name:'Complete', weight: 1, permission:BUSINESS.ice_scooting, guard:guard_id3}
        }
    ]}};

    GUARDS.set(GUARDS_NAME.ice_scooting, guard_id!);
    GUARDS.set(GUARDS_NAME.cancel_ice_scooting, guard_id2!);
    GUARDS.set(GUARDS_NAME.complete_ice_scooting, guard_id3!);
    await result('Machine', await call_machine({data:data4})) // add new forward to machine
}

const permission = async () : Promise<string | undefined>=> {
    const biz : WOWOK.BizPermission[] = [];
    for (const key in BUSINESS) { // add business permissions first.
        if (isNaN(Number(key))) {
           biz.push({index:parseInt(BUSINESS[key]), name:key})
        }
    }
    const data : CallPermission_Data = { description: 'Iceland travel Service Providers',
        biz_permission:{op:'add', data:biz},
        permission:{op:'add entity', entities:[
            {address: TESTOR[0].address, permissions: [ {index:BUSINESS.insurance}, ],},
            {address: TESTOR[1].address, permissions: [ {index:BUSINESS.ice_scooting}, ],},
            {address: TESTOR[2].address, permissions: [ {index:BUSINESS.finance}],},
        ]},
        admin:{op:'add', addresses:[TEST_ADDR()]}
    }
    return await result('Permission', await call_permission({data:data})) as string;
}

// arbitration with independent permission
const arbitration = async () : Promise<string | undefined>=> {
    const data : CallArbitration_Data = { description: 'independent arbitration',  object:{namedNew:{name:'arbitration'}},
        type_parameter: PAY_TYPE,
        permission:{namedNew:{name:'permission for arbitration'}, description:'permission for arbitration'},
        fee_treasury:{namedNew:{name:'treasury for arbitration'}, description:'fee treasury for arbitration'},
        bPaused:false
    }
    return await result('Arbitration', await call_arbitration({data:data})) as string;
}

const machine = async (permission_id:string) : Promise<string | undefined>=> {
    const data : CallMachine_Data = { description: 'machine for traveling Iceland',  object:{namedNew:{name:'machine'}},
        permission:{address:permission_id}, endpoint:'',
        nodes:{op:'add', data:[Insurance, Ice_scooting, Complete, Cancel, Insurance_Fail, Spa]}
    }
    return await result('Machine', await call_machine({data:data})) as string;
}

