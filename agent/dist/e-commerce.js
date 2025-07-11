import { call_arbitration, call_guard, call_machine, call_permission, call_service, ResponseData, WOWOK, Account } from 'wowok_agent';
import { sleep, TESTOR } from './common.js';
const TYPE = WOWOK.Protocol.SUI_TOKEN_TYPE;
var BUSINESS;
(function (BUSINESS) {
    BUSINESS[BUSINESS["confirmOrder"] = 1000] = "confirmOrder";
    BUSINESS[BUSINESS["shipping"] = 1001] = "shipping";
    BUSINESS[BUSINESS["express"] = 1002] = "express";
    BUSINESS[BUSINESS["finance"] = 1003] = "finance";
    BUSINESS[BUSINESS["dispute"] = 1004] = "dispute";
})(BUSINESS || (BUSINESS = {}));
;
const order_confirmation = {
    name: 'Order confirmation',
    pairs: [
        { prior_node: WOWOK.Machine.INITIAL_NODE_NAME, threshold: 0, forwards: [
                { name: 'Confirm order', weight: 1, permission: BUSINESS.confirmOrder },
            ] },
    ]
};
const order_cancellation = {
    name: 'Order cancellation',
    pairs: [
        { prior_node: WOWOK.Machine.INITIAL_NODE_NAME, threshold: 0, forwards: [
                { name: 'Payer cancels', weight: 1, namedOperator: WOWOK.Machine.OPERATOR_ORDER_PAYER },
                { name: 'Seller cancels', weight: 1, permission: BUSINESS.confirmOrder },
            ] },
    ]
};
const goods_shippedout = {
    name: 'Goods shipped out',
    pairs: [
        { prior_node: 'Order confirmation', threshold: 10, forwards: [
                { name: 'Express pickup', weight: 5, permission: BUSINESS.express },
                { name: 'Seller Ships', weight: 5, permission: BUSINESS.shipping },
            ] },
    ]
};
const order_completed = {
    name: 'Order completed',
    pairs: [
        { prior_node: 'Goods shipped out', threshold: 10, forwards: [
                { name: 'Payer sign', weight: 10, namedOperator: WOWOK.Machine.OPERATOR_ORDER_PAYER },
                { name: 'Expdress comfirms', weight: 5, permission: BUSINESS.express },
                { name: 'Shipper comfirms after 15 days', weight: 5, permission: BUSINESS.shipping },
            ] },
        { prior_node: 'Dispute', threshold: 10, forwards: [
                { name: 'Payer comfirms', weight: 6, namedOperator: WOWOK.Machine.OPERATOR_ORDER_PAYER },
                { name: 'Expdress comfirms', weight: 4, permission: BUSINESS.express },
                { name: 'Seller comfirms', weight: 4, permission: BUSINESS.dispute },
            ] },
    ]
};
const return_goods = {
    name: 'Goods Returned',
    pairs: [
        { prior_node: 'Order completed', threshold: 15, forwards: [
                { name: 'Payer request', weight: 5, namedOperator: WOWOK.Machine.OPERATOR_ORDER_PAYER },
                { name: 'Seller comfirms', weight: 5, permission: BUSINESS.confirmOrder },
                { name: 'Expdress comfirms', weight: 5, permission: BUSINESS.express },
            ] },
        { prior_node: 'Dispute', threshold: 15, forwards: [
                { name: 'Payer request', weight: 5, namedOperator: WOWOK.Machine.OPERATOR_ORDER_PAYER },
                { name: 'Seller comfirms', weight: 5, permission: BUSINESS.confirmOrder },
                { name: 'Expdress comfirms', weight: 5, permission: BUSINESS.express },
            ] },
    ]
};
const goods_lost = {
    name: 'Goods lost',
    pairs: [
        { prior_node: 'Dispute', threshold: 10, forwards: [
                { name: 'Seller comfirms', weight: 5, permission: BUSINESS.shipping },
            ] },
        { prior_node: 'Goods shipped out', threshold: 10, forwards: [
                { name: 'Express comfirms', weight: 5, permission: BUSINESS.express },
                { name: 'Seller comfirms', weight: 5, permission: BUSINESS.shipping },
            ] },
    ]
};
const dispute = {
    name: 'Dispute',
    pairs: [
        { prior_node: 'Order completed', threshold: 0, forwards: [] },
    ]
};
export const e_commerce = async () => {
    console.log('current account: ' + (await Account.Instance().default())?.address);
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
    await machine_guards_and_publish(machine_id, permission_id);
    const service_id = await service(machine_id, permission_id, arbitration_id);
    if (!service_id)
        WOWOK.ERROR(WOWOK.Errors.Fail, 'service object failed.');
    await service_guards_and_publish(machine_id, permission_id, service_id, arbitration_id);
};
const service = async (machine_id, permission_id, arbitraion_id) => {
    const sales = [
        { item: 'Play Purse for Little Girls, 35PCS Toddler Purse with Pretend Makeup for Toddlers, Princess Toys Includes Handbag, Phone, Wallet, Camera, Keys, Kids Purse Birthday Gift for Girls Age 3 4 5 6+', price: '3', stock: '102', endpoint: 'https://www.amazon.com/-/zh/dp/B0CC5HY7FW/?_encoding=UTF8&pd_rd_w=WCGMu&content-id=amzn1.sym.4b90c80a-3aee-44a3-b41d-fc2674a3ef63%3Aamzn1.symc.ee4c414f-039b-458d-a009-4479557ca47b&pf_rd_p=4b90c80a-3aee-44a3-b41d-fc2674a3ef63&pf_rd_r=8THXB3PK5QMJY69HTZBT&pd_rd_wg=GncEh&pd_rd_r=cabe72a9-3591-47f1-8cb1-fd10ec2d9db1&ref_=pd_hp_d_btf_ci_mcx_mr_hp_d' },
        { item: 'Little Girls Purse with Accessories and Pretend Makeup for Toddlers - My First Purse Set Includes Handbag, Phone, Wallet, Play Makeup and More Pretend Play Toys for Girls Age 3 +, Great Gift for Girls', price: '5', stock: '111', endpoint: 'https://www.amazon.com/-/zh/dp/B0BJYRT9JL/?_encoding=UTF8&pd_rd_w=WCGMu&content-id=amzn1.sym.4b90c80a-3aee-44a3-b41d-fc2674a3ef63%3Aamzn1.symc.ee4c414f-039b-458d-a009-4479557ca47b&pf_rd_p=4b90c80a-3aee-44a3-b41d-fc2674a3ef63&pf_rd_r=8THXB3PK5QMJY69HTZBT&pd_rd_wg=GncEh&pd_rd_r=cabe72a9-3591-47f1-8cb1-fd10ec2d9db1&ref_=pd_hp_d_btf_ci_mcx_mr_hp_d&th=1' },
        { item: 'Tree House Building Set, Friendship Treehouse Building Toy for Girls, with Slides, Swing, Animals Creative Forest House Building Brick Kits, Great Gift for Kids Who Love Nature', price: '2', stock: '67', endpoint: 'https://www.amazon.com/dp/B0CTHQG2QC/ref=sr_1_1_sspa?__mk_zh_CN=%E4%BA%9A%E9%A9%AC%E9%80%8A%E7%BD%91%E7%AB%99&dib=eyJ2IjoiMSJ9.-74BToXqoNZSYOJd18joki3pJRFcdz2A48Z6SDgyXgdG3ubgYJS56JDSqiHzW9NGNzq35t1UCJDVtB6tjuVa3et20K06IYqBshPc5XMK9hMNOw_bwj2bXcxGURGsD5yYmyC18d1JaqH9mkyRwLmdamSaeEBogjaM4QJV31Xvko4vbMy3elYuCDtOlC_4BQvRiCS5s_cQH_I07eMDAonkmD8-mKVE72HOjqIBWLHPh6apvcLi9ouUUx1PPy8fp7KCbRprsjFzh8EWkGzxjHUQddVvaa4-jDMfkQhMmroAp8s.vc0mkMyz72-tRAlwl2Lzt3ewSdI7BD3Q288AXz8sfHg&dib_tag=se&keywords=%E6%A0%91%E5%B1%8B&qid=1727248906&sr=8-1-spons&sp_csd=d2lkZ2V0TmFtZT1zcF9hdGY&psc=1' },
    ];
    const discount_type_a = {
        name: 'Discounts on Select Holiday Gifts',
        price_greater: BigInt(0),
        type: WOWOK.Service_Discount_Type.ratio,
        off: 20,
        duration_minutes: 10000000,
    };
    const discount_type_b = {
        name: 'Exclusive for old customers',
        price_greater: BigInt(2),
        type: WOWOK.Service_Discount_Type.minus,
        off: 2,
        duration_minutes: 60000000,
    };
    const discounts_dispatch = [
        { receiver: { name_or_address: TESTOR[5].address }, count: 2, discount: discount_type_a },
        { receiver: { name_or_address: TESTOR[6].address }, count: 2, discount: discount_type_a },
        { receiver: { name_or_address: TESTOR[7].address }, count: 2, discount: discount_type_b },
        { receiver: { name_or_address: TESTOR[8].address }, count: 2, discount: discount_type_a },
        { receiver: { name_or_address: TESTOR[9].address }, count: 2, discount: discount_type_a },
    ];
    const data = { object: { name: 'shop service', permission: permission_id, type_parameter: TYPE },
        description: 'A fun shop selling toys', machine: machine_id, payee_treasury: { name: 'shop treasury' },
        arbitration: { op: 'add', objects: [arbitraion_id] },
        gen_discount: discounts_dispatch, customer_required_info: { pubkey: '-----BEGIN PUBLIC KEY----- \
            MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCXFyjaaYXvu26BHM4nYQrPhnjL\
            7ZBQhHUyeLo+4GQ6NmjXM3TPH9O1qlRerQ0vihYxVy6u5QbhElsxDNHp6JtRNlFZ \
            qJE0Q/2KEaTTUU9PWtdt5yHY5Tsao0pgd2N4jiPWIx9wNiYJzcvztlbACU91NAif \
            e6QFRLNGdDVy3RMjOwIDAQAB \
            -----END PUBLIC KEY-----', required_info: [
                WOWOK.BuyRequiredEnum.address, WOWOK.BuyRequiredEnum.phone, WOWOK.BuyRequiredEnum.name
            ] }, sales: { op: 'add', sales: sales }, endpoint: 'https://wowok.net'
    };
    return await result('Service', await call_service({ data: data }));
};
const machine_guards_and_publish = async (machine_id, permission_id) => {
    await guard_confirmation_24hrs_more(machine_id, permission_id);
    await sleep(2000);
    await guard_auto_receipt(machine_id, permission_id);
    await sleep(2000);
    await guard_payer_dispute(machine_id, permission_id);
    await sleep(2000);
    await guard_lost_comfirm_compensate(machine_id, permission_id);
    await sleep(2000);
    const data = { object: machine_id, bPublished: true };
    await result('Machine', await call_machine({ data: data })); // add new forward to machine
};
const service_guards_and_publish = async (machine_id, permission_id, service_id, arbitration_id) => {
    await guard_service_refund(machine_id, permission_id, service_id, arbitration_id);
    await sleep(2000);
    await guard_service_withdraw(machine_id, permission_id, service_id, arbitration_id);
    await sleep(2000);
    const data = { object: service_id, bPublished: true, };
    await result('Service', await call_service({ data: data })); // add new forward to machine
};
const guard_confirmation_24hrs_more = async (machine_id, permission_id) => {
    const data = { namedNew: {},
        description: 'current tx time >= (last session time + 24hrs)',
        table: [{ identifier: 1, bWitness: true, value_type: WOWOK.ValueType.TYPE_ADDRESS }, // progress witness
            { identifier: 2, bWitness: false, value_type: WOWOK.ValueType.TYPE_ADDRESS, value: machine_id } // machine
        ],
        root: { logic: WOWOK.OperatorType.TYPE_LOGIC_AND, parameters: [
                { logic: WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters: [
                        { query: 800, object: 1, parameters: [] }, // progress.machine
                        { identifier: 2 }
                    ] },
                { logic: WOWOK.OperatorType.TYPE_LOGIC_AS_U256_GREATER, parameters: [
                        { context: WOWOK.ContextType.TYPE_CLOCK },
                        { calc: WOWOK.OperatorType.TYPE_NUMBER_ADD, parameters: [
                                { query: 810, object: 1, parameters: [] }, // Last Session Time
                                { value_type: WOWOK.ValueType.TYPE_U64, value: 86400000 } // 24 hrs
                            ] }
                    ] }
            ] }
    };
    const guard_id = await result('Guard', await call_guard({ data: data }));
    sleep(2000);
    if (!guard_id)
        WOWOK.ERROR(WOWOK.Errors.Fail, 'guard_confirmation_24hrs_more');
    const data2 = { object: machine_id,
        nodes: { op: 'add forward', data: [{ prior_node_name: order_confirmation.name, node_name: order_cancellation.name,
                    forward: { name: 'Goods not shipped for more than 24 hours', weight: 1, namedOperator: WOWOK.Machine.OPERATOR_ORDER_PAYER, guard: guard_id }
                }] }
    };
    await result('Machine', await call_machine({ data: data2 })); // add new forward to machine
};
const guard_auto_receipt = async (machine_id, permission_id) => {
    const data = { namedNew: {},
        description: 'current tx time >= (last session time + 15 days)',
        table: [{ identifier: 1, bWitness: true, value_type: WOWOK.ValueType.TYPE_ADDRESS }, // progress witness
            { identifier: 2, bWitness: false, value_type: WOWOK.ValueType.TYPE_ADDRESS, value: machine_id } // machine
        ],
        root: { logic: WOWOK.OperatorType.TYPE_LOGIC_AND, parameters: [
                { logic: WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters: [
                        { query: 800, object: 1, parameters: [] }, // progress.machine
                        { identifier: 2 }
                    ] },
                { logic: WOWOK.OperatorType.TYPE_LOGIC_AS_U256_GREATER, parameters: [
                        { context: WOWOK.ContextType.TYPE_CLOCK },
                        { calc: WOWOK.OperatorType.TYPE_NUMBER_ADD, parameters: [
                                { query: 810, object: 1, parameters: [] }, // Last Session Time
                                { value_type: WOWOK.ValueType.TYPE_U64, value: 1296000000 } // 15 days
                            ] }
                    ] }
            ] }
    };
    const guard_id = await result('Guard', await call_guard({ data: data }));
    await sleep(2000);
    if (!guard_id)
        WOWOK.ERROR(WOWOK.Errors.Fail, 'guard_auto_receipt');
    const data2 = { object: machine_id,
        nodes: { op: 'add forward', data: [{ prior_node_name: goods_shippedout.name, node_name: order_completed.name,
                    forward: { name: 'Shipper comfirms after 15 days', weight: 5, permission: BUSINESS.shipping, guard: guard_id }
                }] }
    };
    await result('Machine', await call_machine({ data: data2 })); // add new forward to machine
};
const guard_payer_dispute = async (machine_id, permission_id) => {
    const data = { namedNew: {},
        description: 'current tx time <= (last session time + 15 days)',
        table: [{ identifier: 1, bWitness: true, value_type: WOWOK.ValueType.TYPE_ADDRESS }, // progress witness
            { identifier: 2, bWitness: false, value_type: WOWOK.ValueType.TYPE_ADDRESS, value: machine_id } // machine
        ],
        root: { logic: WOWOK.OperatorType.TYPE_LOGIC_AND, parameters: [
                { logic: WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters: [
                        { query: 800, object: 1, parameters: [] }, // progress.machine
                        { identifier: 2 } // machine id
                    ] },
                { logic: WOWOK.OperatorType.TYPE_LOGIC_AS_U256_LESSER, parameters: [
                        { context: WOWOK.ContextType.TYPE_CLOCK },
                        { calc: WOWOK.OperatorType.TYPE_NUMBER_ADD, parameters: [
                                { query: 810, object: 1, parameters: [] }, // Last Session Time
                                { value_type: WOWOK.ValueType.TYPE_U64, value: 1296000000 } // 15 days
                            ] }
                    ] }
            ] }
    };
    const guard_id = await result('Guard', await call_guard({ data: data }));
    await sleep(2000);
    if (!guard_id)
        WOWOK.ERROR(WOWOK.Errors.Fail, 'guard_auto_receipt');
    const data2 = { object: machine_id,
        nodes: { op: 'add forward', data: [{ prior_node_name: order_completed.name, node_name: dispute.name,
                    forward: { name: 'Confirm no package received within 15 days', weight: 1, permission: BUSINESS.shipping, guard: guard_id }
                }] }
    };
    await result('Machine', await call_machine({ data: data2 })); // add new forward to machine
};
const guard_lost_comfirm_compensate = async (machine_id, permission_id) => {
    const data1 = { namedNew: {},
        description: 'Compensation 1000000 to order payer for responsing exceeding 24 hours',
        table: [{ identifier: 1, bWitness: true, value_type: WOWOK.ValueType.TYPE_ADDRESS }, // progress witness
            { identifier: 2, bWitness: true, value_type: WOWOK.ValueType.TYPE_ADDRESS }, // payment witness
            { identifier: 3, bWitness: true, value_type: WOWOK.ValueType.TYPE_ADDRESS } // order witness
        ],
        root: { logic: WOWOK.OperatorType.TYPE_LOGIC_AND, parameters: [
                { logic: WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters: [
                        { query: 800, object: 1, parameters: [] }, // progress.machine
                        { value_type: WOWOK.ValueType.TYPE_ADDRESS, value: machine_id }
                    ] },
                { logic: WOWOK.OperatorType.TYPE_LOGIC_AS_U256_GREATER, parameters: [
                        { context: WOWOK.ContextType.TYPE_CLOCK },
                        { calc: WOWOK.OperatorType.TYPE_NUMBER_ADD, parameters: [
                                { query: 810, object: 1, parameters: [] }, // Last Session Time
                                { value_type: WOWOK.ValueType.TYPE_U64, value: 86400000 } // 24 hrs
                            ] }
                    ] },
                { logic: WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters: [
                        { query: 504, object: 3, parameters: [] }, // oerder.progress
                        { identifier: 1 } // progress witness
                    ] },
                { logic: WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters: [
                        { query: 1206, object: 2, parameters: [] }, // payment.Object for Perpose 
                        { identifier: 1 } // this progress
                    ] },
                { logic: WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters: [
                        { query: 1205, object: 2, parameters: [] }, // payment.Guard for Perpose
                        { context: WOWOK.ContextType.TYPE_GUARD } // this guard verifying
                    ] },
                { logic: WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters: [
                        { query: 1213, object: 2, parameters: [] }, // payment.Biz-ID
                        { query: 812, object: 1, parameters: [] }, // progress.Current Session-id
                    ] },
                { logic: WOWOK.OperatorType.TYPE_LOGIC_AS_U256_GREATER_EQUAL, parameters: [
                        { query: 1209, object: 2, parameters: [
                                { query: 501, object: 3, parameters: [] }, // order.payer
                            ] },
                        { value_type: WOWOK.ValueType.TYPE_U64, value: 1000000 }
                    ] },
            ] }
    };
    const guard_id1 = await result('Guard', await call_guard({ data: data1 }));
    await sleep(2000);
    if (!guard_id1)
        WOWOK.ERROR(WOWOK.Errors.Fail, 'guard_lost_comfirm_compensate: more than 24hrs');
    const data2 = { namedNew: {},
        description: 'current tx time <= (last session time + 24hrs)',
        table: [{ identifier: 1, bWitness: true, value_type: WOWOK.ValueType.TYPE_ADDRESS }, // progress witness
            { identifier: 2, bWitness: false, value_type: WOWOK.ValueType.TYPE_ADDRESS, value: machine_id } // machine
        ],
        root: { logic: WOWOK.OperatorType.TYPE_LOGIC_AND, parameters: [
                { logic: WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters: [
                        { query: 800, object: 1, parameters: [] }, // progress.machine
                        { identifier: 2 }
                    ] },
                { logic: WOWOK.OperatorType.TYPE_LOGIC_AS_U256_LESSER_EQUAL, parameters: [
                        { context: WOWOK.ContextType.TYPE_CLOCK },
                        { calc: WOWOK.OperatorType.TYPE_NUMBER_ADD, parameters: [
                                { query: 810, object: 1, parameters: [] }, // Last Session Time
                                { value_type: WOWOK.ValueType.TYPE_U64, value: 86400000 } // 24 hrs
                            ] }
                    ] }
            ] }
    };
    const guard_id2 = await result('Guard', await call_guard({ data: data2 }));
    await sleep(2000);
    if (!guard_id2)
        WOWOK.ERROR(WOWOK.Errors.Fail, 'guard_lost_comfirm_compensate: less than 24hrs');
    const data3 = { object: machine_id,
        nodes: { op: 'add forward', data: [
                { prior_node_name: dispute.name, node_name: goods_lost.name,
                    forward: { name: 'Compensation 100000000 exceeding 24 hours', weight: 5, permission: BUSINESS.express, guard: guard_id1 }
                }, { prior_node_name: dispute.name, node_name: goods_lost.name,
                    forward: { name: 'Response within 24hrs if package lost', weight: 5, permission: BUSINESS.express, guard: guard_id2 }
                }
            ] }
    };
    await result('Machine', await call_machine({ data: data3 })); // add new forward to machine
};
const guard_service_withdraw = async (machine_id, permission_id, service_id, arbitration_id) => {
    const data1 = { namedNew: {},
        description: 'Widthdraw on status: ' + order_completed.name + ' more than 15 days; \nService: ' + service_id,
        table: [{ identifier: 1, bWitness: true, value_type: WOWOK.ValueType.TYPE_ADDRESS }, // progress witness
            { identifier: 2, bWitness: false, value_type: WOWOK.ValueType.TYPE_ADDRESS, value: machine_id } // machine
        ],
        root: { logic: WOWOK.OperatorType.TYPE_LOGIC_AND, parameters: [
                { logic: WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters: [
                        { query: 800, object: 1, parameters: [] }, // progress.machine
                        { identifier: 2 }
                    ] },
                { logic: WOWOK.OperatorType.TYPE_LOGIC_AS_U256_GREATER_EQUAL, parameters: [
                        { context: WOWOK.ContextType.TYPE_CLOCK },
                        { calc: WOWOK.OperatorType.TYPE_NUMBER_ADD, parameters: [
                                { query: 810, object: 1, parameters: [] }, // Last Session Time
                                { value_type: WOWOK.ValueType.TYPE_U64, value: 1296000000 } // 15 days
                            ] }
                    ] },
                { logic: WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters: [
                        { query: 801, object: 1, parameters: [] }, // 'Current Node'
                        { value_type: WOWOK.ValueType.TYPE_STRING, value: order_completed.name }
                    ] }
            ] }
    };
    const guard_id1 = await result('Guard', await call_guard({ data: data1 }));
    await sleep(2000);
    if (!guard_id1)
        WOWOK.ERROR(WOWOK.Errors.Fail, 'guard_service_withdraw: guard 1');
    const data2 = { namedNew: {},
        description: 'Widthdraw on status: ' + dispute.name + ' Wait 30 days to receive the results of a trusted Arbitration ' + arbitration_id + '. And within 30 days, the user can initiate a refund at any time based on the Arb arbitration results.',
        table: [{ identifier: 1, bWitness: true, value_type: WOWOK.ValueType.TYPE_ADDRESS }, // progress witness
            { identifier: 2, bWitness: false, value_type: WOWOK.ValueType.TYPE_ADDRESS, value: machine_id } // machine
        ],
        root: { logic: WOWOK.OperatorType.TYPE_LOGIC_AND, parameters: [
                { logic: WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters: [
                        { query: 800, object: 1, parameters: [] }, // progress.machine
                        { identifier: 2 }
                    ] },
                { logic: WOWOK.OperatorType.TYPE_LOGIC_AS_U256_GREATER_EQUAL, parameters: [
                        { context: WOWOK.ContextType.TYPE_CLOCK },
                        { calc: WOWOK.OperatorType.TYPE_NUMBER_ADD, parameters: [
                                { query: 810, object: 1, parameters: [] }, // Last Session Time
                                { value_type: WOWOK.ValueType.TYPE_U64, value: 2592000000 } // 30 days
                            ] }
                    ] },
                { logic: WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters: [
                        { query: 801, object: 1, parameters: [] }, //'Current Node'
                        { value_type: WOWOK.ValueType.TYPE_STRING, value: dispute.name }
                    ] }
            ] }
    };
    const guard_id2 = await result('Guard', await call_guard({ data: data2 }));
    await sleep(2000);
    if (!guard_id2)
        WOWOK.ERROR(WOWOK.Errors.Fail, 'guard_service_withdraw: guard 2');
    const data3 = { object: service_id,
        withdraw_guard: { op: 'add', guards: [{ guard: guard_id1, percent: 100 }, { guard: guard_id2, percent: 100 }] }
    };
    await result('Service', await call_service({ data: data3 }));
};
const guard_service_refund = async (machine_id, permission_id, service_id, arbitration_id) => {
    const data1 = { namedNew: {},
        description: 'Refund Guard for Service: ' + service_id,
        table: [{ identifier: 1, bWitness: true, value_type: WOWOK.ValueType.TYPE_ADDRESS }, // progress witness
            { identifier: 2, bWitness: false, value_type: WOWOK.ValueType.TYPE_ADDRESS, value: machine_id } // machine
        ],
        root: { logic: WOWOK.OperatorType.TYPE_LOGIC_AND, parameters: [
                { logic: WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters: [
                        { query: 800, object: 1, parameters: [] }, // progress.machine
                        { identifier: 2 }
                    ] },
                { logic: WOWOK.OperatorType.TYPE_LOGIC_OR, parameters: [
                        { logic: WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters: [
                                { query: 801, object: 1, parameters: [] }, // 'Current Node'
                                { value_type: WOWOK.ValueType.TYPE_STRING, value: goods_lost.name }
                            ] },
                        { logic: WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters: [
                                { query: 801, object: 1, parameters: [] }, // 'Current Node'
                                { value_type: WOWOK.ValueType.TYPE_STRING, value: order_cancellation.name }
                            ] }
                    ] },
            ] }
    };
    const guard_id1 = await result('Guard', await call_guard({ data: data1 }));
    await sleep(2000);
    if (!guard_id1)
        WOWOK.ERROR(WOWOK.Errors.Fail, 'guard_service_refund: guard 1');
    const data2 = { namedNew: {},
        description: 'Returns sent more than 15 days for Service: ' + service_id,
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
                        { value_type: WOWOK.ValueType.TYPE_STRING, value: return_goods.name }
                    ] },
                { logic: WOWOK.OperatorType.TYPE_LOGIC_AS_U256_GREATER_EQUAL, parameters: [
                        { context: WOWOK.ContextType.TYPE_CLOCK },
                        { calc: WOWOK.OperatorType.TYPE_NUMBER_ADD, parameters: [
                                { query: 810, object: 1, parameters: [] }, // Last Session Time
                                { value_type: WOWOK.ValueType.TYPE_U64, value: 1296000000 } // 15 days
                            ] }
                    ] },
            ] }
    };
    const guard_id2 = await result('Guard', await call_guard({ data: data2 }));
    await sleep(2000);
    if (!guard_id2)
        WOWOK.ERROR(WOWOK.Errors.Fail, 'guard_service_refund: guard 2');
    const data3 = { object: service_id,
        refund_guard: { op: 'add', guards: [{ guard: guard_id1, percent: 100 }, { guard: guard_id2, percent: 100 }] }
    };
    await result('Service', await call_service({ data: data3 }));
};
const permission = async () => {
    const biz = [];
    for (const key in BUSINESS) { // add business permissions first.
        if (isNaN(Number(key))) {
            biz.push({ index: parseInt(BUSINESS[key]), name: key });
        }
    }
    const data = { description: 'A fun shop selling toys', object: { name: 'shop permission' },
        biz_permission: { op: 'add', data: biz },
        permission: { op: 'add entity', entities: [
                { address: { name_or_address: TESTOR[0].address }, permissions: [{ index: BUSINESS.confirmOrder },], },
                { address: { name_or_address: TESTOR[1].address }, permissions: [{ index: BUSINESS.confirmOrder }, { index: BUSINESS.shipping }], },
                { address: { name_or_address: TESTOR[2].address }, permissions: [{ index: BUSINESS.shipping }], },
                { address: { name_or_address: TESTOR[3].address }, permissions: [{ index: BUSINESS.express },], },
                { address: { name_or_address: TESTOR[4].address }, permissions: [{ index: BUSINESS.express },], },
                { address: { name_or_address: TESTOR[5].address }, permissions: [{ index: BUSINESS.finance },], },
                { address: { name_or_address: TESTOR[6].address }, permissions: [{ index: BUSINESS.dispute },], },
            ] },
        admin: { op: 'add', addresses: [{ name_or_address: TESTOR[0].address }] }
    };
    return await result('Permission', await call_permission({ data: data }));
};
// arbitration with independent permission
const arbitration = async () => {
    const data = { description: 'independent arbitration',
        object: { name: 'arbitration', type_parameter: TYPE, permission: { name: 'permission for arbitration', description: 'permission for arbitration' }, },
        fee_treasury: { name: 'treasury for arbitration', description: 'fee treasury for arbitration' },
        bPaused: false };
    const r = await result('Arbitration', await call_arbitration({ data: data }));
    return r;
};
const machine = async (permission_id) => {
    const data = { description: 'machine for a fun shop selling toys',
        object: { name: 'machine', permission: permission_id, },
        endpoint: 'https://wowok.net/',
        nodes: { op: 'add', data: [order_confirmation, order_cancellation, order_completed, goods_shippedout, goods_lost, dispute, return_goods] }
    };
    return await result('Machine', await call_machine({ data: data }));
};
const result = async (type, res) => {
    if (res?.digest) {
        const r = ResponseData(res);
        if (r) {
            const i = r.find(v => v.type === type)?.object;
            console.log(type + ': ' + i);
            return i;
        }
    }
};
