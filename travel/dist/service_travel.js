/**
 * Ice Scooting Service
 * Buy insurance services on behalf of users.
 * Whether the service can be performed depending on weather conditions; If the service cannot be performed due to weather, a full refund will be made.
 */
import { call_arbitration, call_guard, call_machine, call_permission, call_service, WOWOK } from 'wowok_agent';
import { sleep, TESTOR, TEST_ADDR, result, PAY_TYPE, PUBKEY, TRAVEL_PRODUCT, GUARDS_NAME, GUARDS } from './common';
import { Weather } from './weather';
var BUSINESS;
(function (BUSINESS) {
    BUSINESS[BUSINESS["insurance"] = 1000] = "insurance";
    BUSINESS[BUSINESS["finance"] = 1001] = "finance";
    BUSINESS[BUSINESS["ice_scooting"] = 1002] = "ice_scooting";
    BUSINESS[BUSINESS["spa"] = 1003] = "spa";
})(BUSINESS || (BUSINESS = {}));
;
export var TRAVEL_MACHINE_NODE;
(function (TRAVEL_MACHINE_NODE) {
    TRAVEL_MACHINE_NODE["Insurance"] = "Purchase insurance";
    TRAVEL_MACHINE_NODE["Ice_scooting"] = "Ice scooting";
    TRAVEL_MACHINE_NODE["Complete"] = "Complete";
    TRAVEL_MACHINE_NODE["Cancel"] = "Cancelled ice scooting";
    TRAVEL_MACHINE_NODE["Insurance_Fail"] = "Insurance purchase failure";
    TRAVEL_MACHINE_NODE["Spa"] = "Accommodation and spa";
})(TRAVEL_MACHINE_NODE || (TRAVEL_MACHINE_NODE = {}));
const Insurance = {
    name: TRAVEL_MACHINE_NODE.Insurance,
    pairs: [
        { prior_node: WOWOK.Machine.INITIAL_NODE_NAME, threshold: 0, forwards: [] },
    ]
};
const Spa = {
    name: TRAVEL_MACHINE_NODE.Spa,
    pairs: [
        { prior_node: TRAVEL_MACHINE_NODE.Insurance, threshold: 0, forwards: [
                { name: 'Comfirm', weight: 1, namedOperator: WOWOK.Machine.OPERATOR_ORDER_PAYER },
                { name: 'Accommodation and spa', weight: 1, permission: BUSINESS.spa },
            ] },
    ]
};
const Ice_scooting = {
    name: TRAVEL_MACHINE_NODE.Ice_scooting,
    pairs: [
        { prior_node: TRAVEL_MACHINE_NODE.Spa, threshold: 0, forwards: [
                { name: 'Comfirm Enter', weight: 1, namedOperator: WOWOK.Machine.OPERATOR_ORDER_PAYER },
            ] },
    ]
};
const Complete = {
    name: TRAVEL_MACHINE_NODE.Complete,
    pairs: [
        { prior_node: TRAVEL_MACHINE_NODE.Ice_scooting, threshold: 0, forwards: [] },
    ]
};
const Cancel = {
    name: TRAVEL_MACHINE_NODE.Cancel,
    pairs: [
        { prior_node: TRAVEL_MACHINE_NODE.Spa, threshold: 0, forwards: [] },
    ]
};
const Insurance_Fail = {
    name: TRAVEL_MACHINE_NODE.Insurance_Fail,
    pairs: [
        { prior_node: WOWOK.Machine.INITIAL_NODE_NAME, threshold: 0, forwards: [
                { name: 'Failure to purchase insurance', weight: 1, permission: BUSINESS.insurance },
            ] },
    ]
};
export const travel = async (weather_repository, insurance_service) => {
    const permission_id = await permission();
    await sleep(2000);
    if (!permission_id)
        WOWOK.ERROR(WOWOK.Errors.Fail, 'permission object failed.');
    const arbitration_id = await arbitration();
    await sleep(2000);
    if (!arbitration_id)
        WOWOK.ERROR(WOWOK.Errors.Fail, 'arbitration object failed.');
    const machine_id = await machine(permission_id);
    await sleep(2000);
    if (!machine_id)
        WOWOK.ERROR(WOWOK.Errors.Fail, 'machine object failed.');
    await machine_guards_and_publish(machine_id, permission_id, weather_repository, insurance_service);
    const service_id = await service(machine_id, permission_id, weather_repository, arbitration_id);
    if (!service_id)
        WOWOK.ERROR(WOWOK.Errors.Fail, 'service object failed.');
    await service_guards_and_publish(machine_id, permission_id, service_id);
    return { machine: machine_id, service: service_id };
};
const service = async (machine_id, permission_id, repository_id, arbitraion_id) => {
    const data = { object: { permission: permission_id, type_parameter: PAY_TYPE },
        description: `traveling Iceland. There is a small family company for Local Guide of Vatnsjökull and really stand out in terms of quality.
        Hotel Djúpavík - way out on a dirt road in the Westfjords. Just a quiet family hotel in the middle of nowhere on a fjord. And the hot spring on the beach at Krossnes.
        And ice scooting started the next day.`, machine: machine_id,
        repository: { op: 'add', objects: [repository_id] },
        customer_required_info: { pubkey: PUBKEY, required_info: [
                WOWOK.BuyRequiredEnum.address, WOWOK.BuyRequiredEnum.phone, WOWOK.BuyRequiredEnum.name
            ] },
        sales: { op: 'add', sales: [TRAVEL_PRODUCT] }, endpoint: 'https://x4o43luhbc.feishu.cn/docx/IyA4dUXx1o6ilDxQMMKc3CoonGd?from=from_copylink',
        arbitration: { op: 'add', objects: [arbitraion_id] }
    };
    return await result('Service', await call_service({ data: data }));
};
const machine_guards_and_publish = async (machine_id, permission_id, repository_id, insurance_suppliers) => {
    await guard_ice_scooting(machine_id, permission_id, repository_id);
    const data = { object: machine_id,
        nodes: { op: 'add forward', data: [{ prior_node_name: WOWOK.Machine.INITIAL_NODE_NAME, node_name: TRAVEL_MACHINE_NODE.Insurance,
                    forward: { name: 'Purchase', weight: 1, permission: BUSINESS.insurance, suppliers: insurance_suppliers?.map(v => { return { service: v, bRequired: false }; }) }
                }] },
        bPublished: true
    };
    await result('Machine', await call_machine({ data: data })); // add new forward to machine
};
const service_guards_and_publish = async (machine_id, permission_id, service_id) => {
    const data_withdraw1 = { namedNew: {},
        description: 'Widthdraw for ' + service_id,
        table: [{ identifier: 1, bWitness: true, value_type: WOWOK.ValueType.TYPE_ADDRESS }, // progress witness
            { identifier: 2, bWitness: false, value_type: WOWOK.ValueType.TYPE_ADDRESS, value: machine_id } // machine
        ],
        root: { logic: WOWOK.OperatorType.TYPE_LOGIC_AND, parameters: [
                { logic: WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters: [
                        { query: 800, object: 1, parameters: [] }, // progress.machine
                        { identifier: 2 }
                    ] },
                { logic: WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters: [
                        { query: 801, object: 1, parameters: [] }, // 'Current Node'
                        { value_type: WOWOK.ValueType.TYPE_STRING, value: TRAVEL_MACHINE_NODE.Complete }
                    ] }
            ] }
    };
    const data_withdraw2 = { namedNew: {},
        description: 'Widthdraw for ' + service_id,
        table: [{ identifier: 1, bWitness: true, value_type: WOWOK.ValueType.TYPE_ADDRESS }, // progress witness
            { identifier: 2, bWitness: false, value_type: WOWOK.ValueType.TYPE_ADDRESS, value: machine_id } // machine
        ],
        root: { logic: WOWOK.OperatorType.TYPE_LOGIC_AND, parameters: [
                { logic: WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters: [
                        { query: 800, object: 1, parameters: [] }, // progress.machine
                        { identifier: 2 }
                    ] },
                { logic: WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters: [
                        { query: 801, object: 1, parameters: [] }, // 'Current Node'
                        { value_type: WOWOK.ValueType.TYPE_STRING, value: TRAVEL_MACHINE_NODE.Cancel }
                    ] }
            ] }
    };
    const withdraw1 = await result('Guard', await call_guard({ data: data_withdraw1 }));
    if (!withdraw1)
        WOWOK.ERROR(WOWOK.Errors.Fail, 'guard_service_withdraw 1');
    const withdraw2 = await result('Guard', await call_guard({ data: data_withdraw2 }));
    if (!withdraw2)
        WOWOK.ERROR(WOWOK.Errors.Fail, 'guard_service_withdraw 2');
    const data_refund1 = { namedNew: {},
        description: 'Refund for ' + service_id,
        table: [{ identifier: 1, bWitness: true, value_type: WOWOK.ValueType.TYPE_ADDRESS }, // progress witness
            { identifier: 2, bWitness: false, value_type: WOWOK.ValueType.TYPE_ADDRESS, value: machine_id } // machine
        ],
        root: { logic: WOWOK.OperatorType.TYPE_LOGIC_AND, parameters: [
                { logic: WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters: [
                        { query: 800, object: 1, parameters: [] }, // progress.machine
                        { identifier: 2 }
                    ] },
                { logic: WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters: [
                        { query: 801, object: 1, parameters: [] }, // 'Current Node'
                        { value_type: WOWOK.ValueType.TYPE_STRING, value: TRAVEL_MACHINE_NODE.Insurance_Fail }
                    ] }
            ] }
    };
    const data_refund2 = { namedNew: {},
        description: 'Refund for ' + service_id,
        table: [{ identifier: 1, bWitness: true, value_type: WOWOK.ValueType.TYPE_ADDRESS }, // progress witness
            { identifier: 2, bWitness: false, value_type: WOWOK.ValueType.TYPE_ADDRESS, value: machine_id } // machine
        ],
        root: { logic: WOWOK.OperatorType.TYPE_LOGIC_AND, parameters: [
                { logic: WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters: [
                        { query: 800, object: 1, parameters: [] }, // progress.machine
                        { identifier: 2 }
                    ] },
                { logic: WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters: [
                        { query: 801, object: 1, parameters: [] }, // 'Current Node'
                        { value_type: WOWOK.ValueType.TYPE_STRING, value: TRAVEL_MACHINE_NODE.Cancel }
                    ] }
            ] }
    };
    const refund1 = await result('Guard', await call_guard({ data: data_refund1 }));
    if (!refund1)
        WOWOK.ERROR(WOWOK.Errors.Fail, 'guard_service_refund 1');
    const refund2 = await result('Guard', await call_guard({ data: data_refund2 }));
    if (!refund2)
        WOWOK.ERROR(WOWOK.Errors.Fail, 'guard_service_refund 2');
    const data2 = { object: service_id,
        withdraw_guard: { op: 'add', guards: [{ guard: withdraw1, percent: 100 }, { guard: withdraw2, percent: 60 },] },
        refund_guard: { op: 'add', guards: [{ guard: refund1, percent: 100 }, { guard: refund2, percent: 40 },] },
        bPublished: true };
    await result('Service', await call_service({ data: data2 }));
};
const guard_ice_scooting = async (machine_id, permission_id, weather_repository) => {
    const weather_cond = { query: 115, object: weather_repository, parameters: [
            { calc: WOWOK.OperatorType.TYPE_NUMBER_ADDRESS, parameters: [
                    { calc: WOWOK.OperatorType.TYPE_NUMBER_MULTIPLY, parameters: [
                            { calc: WOWOK.OperatorType.TYPE_NUMBER_DEVIDE, parameters: [
                                    { context: WOWOK.ContextType.TYPE_CLOCK },
                                    { value: 24 * 60 * 60 * 1000, value_type: WOWOK.ValueType.TYPE_U64 } // 1 day
                                ] },
                            { value: 24 * 60 * 60 * 1000, value_type: WOWOK.ValueType.TYPE_U64 }
                        ] }
                ] },
            { value: Weather.Ice_scooting_suitable, value_type: WOWOK.ValueType.TYPE_STRING }
        ] };
    const data = {
        description: 'Determine if the weather conditions are suitable for ice scooter events',
        root: weather_cond
    };
    const guard_id = await result('Guard', await call_guard({ data: data }));
    if (!guard_id)
        WOWOK.ERROR(WOWOK.Errors.Fail, 'guard_ice_scooting');
    const data2 = {
        description: 'Determine if the weather conditions are suitable for ice scooter events',
        root: { logic: WOWOK.OperatorType.TYPE_LOGIC_NOT, parameters: [
                weather_cond
            ] }
    };
    const guard_id2 = await result('Guard', await call_guard({ data: data2 }));
    if (!guard_id2)
        WOWOK.ERROR(WOWOK.Errors.Fail, 'guard_ice_scooting 2');
    //{name:'Complete', weight: 1, permission:BUSINESS.ice_scooting},
    const data3 = {
        description: '8 hours project time completed',
        table: [{ identifier: 1, value_type: WOWOK.ValueType.TYPE_ADDRESS, bWitness: true }],
        root: { logic: WOWOK.OperatorType.TYPE_LOGIC_AND, parameters: [
                { logic: WOWOK.OperatorType.TYPE_LOGIC_AS_U256_GREATER, parameters: [
                        { context: WOWOK.ContextType.TYPE_CLOCK },
                        { calc: WOWOK.OperatorType.TYPE_NUMBER_ADD, parameters: [
                                { query: 810, object: 1, parameters: [] },
                                { value: /*8*60*60*1000*/ 1000, value_type: WOWOK.ValueType.TYPE_U64 } // 1s for test
                            ] }
                    ] },
                { logic: WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters: [
                        { query: 800, object: 1, parameters: [] },
                        { value: machine_id, value_type: WOWOK.ValueType.TYPE_ADDRESS }
                    ] }
            ] }
    };
    const guard_id3 = await result('Guard', await call_guard({ data: data3 }));
    if (!guard_id3)
        WOWOK.ERROR(WOWOK.Errors.Fail, 'guard_ice_scooting 3');
    const data4 = { object: machine_id,
        nodes: { op: 'add forward', data: [{ prior_node_name: TRAVEL_MACHINE_NODE.Spa, node_name: TRAVEL_MACHINE_NODE.Ice_scooting,
                    forward: { name: 'Enter', weight: 1, permission: BUSINESS.ice_scooting, guard: guard_id }
                },
                { prior_node_name: TRAVEL_MACHINE_NODE.Spa, node_name: TRAVEL_MACHINE_NODE.Cancel,
                    forward: { name: 'Weather not suitable', weight: 1, permission: BUSINESS.ice_scooting, guard: guard_id2 }
                },
                { prior_node_name: TRAVEL_MACHINE_NODE.Ice_scooting, node_name: TRAVEL_MACHINE_NODE.Complete,
                    forward: { name: 'Complete', weight: 1, permission: BUSINESS.ice_scooting, guard: guard_id3 }
                }
            ] } };
    GUARDS.set(GUARDS_NAME.ice_scooting, guard_id);
    GUARDS.set(GUARDS_NAME.cancel_ice_scooting, guard_id2);
    GUARDS.set(GUARDS_NAME.complete_ice_scooting, guard_id3);
    await result('Machine', await call_machine({ data: data4 })); // add new forward to machine
};
const permission = async () => {
    const biz = [];
    for (const key in BUSINESS) { // add business permissions first.
        if (isNaN(Number(key))) {
            biz.push({ index: parseInt(BUSINESS[key]), name: key });
        }
    }
    const data = { description: 'Iceland travel Service Providers', object: {},
        biz_permission: { op: 'add', data: biz },
        permission: { op: 'add entity', entities: [
                { address: { name_or_address: TESTOR[0].address }, permissions: [{ index: BUSINESS.insurance },], },
                { address: { name_or_address: TESTOR[1].address }, permissions: [{ index: BUSINESS.ice_scooting },], },
                { address: { name_or_address: TESTOR[2].address }, permissions: [{ index: BUSINESS.finance }], },
            ] },
        admin: { op: 'add', addresses: [{ name_or_address: TEST_ADDR() }] }
    };
    return await result('Permission', await call_permission({ data: data }));
};
// arbitration with independent permission
const arbitration = async () => {
    const data = { description: 'independent arbitration',
        object: { name: 'arbitration', type_parameter: PAY_TYPE,
            permission: { name: 'permission for arbitration', description: 'permission for arbitration' } },
        fee_treasury: { name: 'treasury for arbitration', description: 'fee treasury for arbitration' },
        bPaused: false
    };
    return await result('Arbitration', await call_arbitration({ data: data }));
};
const machine = async (permission_id) => {
    const data = { description: 'machine for traveling Iceland',
        object: { name: 'machine', permission: permission_id }, endpoint: '',
        nodes: { op: 'add', data: [Insurance, Ice_scooting, Complete, Cancel, Insurance_Fail, Spa] }
    };
    return await result('Machine', await call_machine({ data: data }));
};
