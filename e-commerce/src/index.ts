
import { Protocol, ENTRYPOINT, TxbObject, RpcResultParser, GuardParser, Wowok, Machine_Node, Machine, Permission_Entity, 
    PermissionIndex, Permission, Service, Service_Sale, DicountDispatch, Service_Discount_Type, Service_Discount, Guard,
    GuardMaker, MODULES, BuyRequiredEnum, ContextType, ValueType, OperatorType, Machine_Forward, Treasury, Arbitration,
} from 'wowok';
import { TEST_PRIV, TEST_ADDR, TESTOR } from './common'

const SERVICE_PAY_TYPE = Protocol.SUI_TOKEN_TYPE; // token for pay

const main = async () => {
    let protocol = new Protocol(ENTRYPOINT.suitest)
    let ids = new Map<string, TxbObject[]>();
    
    // permission
    RpcResultParser.objectids_from_response(protocol, await protocol.sign_excute([permission], TEST_PRIV(), ids), ids);
    console.log('permission id: ' + ids.get('permission::Permission'));  await sleep(2000)
   
    // arbitration 
    RpcResultParser.objectids_from_response(protocol, await protocol.sign_excute([arbitration], TEST_PRIV(), ids), ids);
    console.log('arbitration id: ' + ids.get('arbitration::Arbitration'));  await sleep(2000)

    // machine
    await machine(protocol, ids);
    console.log('machine id: ' + ids.get('machine::Machine')); 
    
    // guard
    RpcResultParser.objectids_from_response(protocol, await protocol.sign_excute([guard_confirmation_24hrs_more], TEST_PRIV(), ids), ids);  await sleep(2000); // guard 0
    RpcResultParser.objectids_from_response(protocol, await protocol.sign_excute([guard_receipt], TEST_PRIV(), ids), ids);  await sleep(2000); // guard 0
    RpcResultParser.objectids_from_response(protocol, await protocol.sign_excute([guard_payer_lost], TEST_PRIV(), ids), ids);  await sleep(2000); // guard 2
    RpcResultParser.objectids_from_response(protocol, await protocol.sign_excute([guard_lost_comfirm_compensate], TEST_PRIV(), ids), ids); // guard 3
    console.log('guard id: ' + ids.get('guard::Guard'));  

    // publish machine
    RpcResultParser.objectids_from_response(protocol, await protocol.sign_excute([machine_publish], TEST_PRIV(), ids), ids); await sleep(2000)

    // service
    RpcResultParser.objectids_from_response(protocol, await protocol.sign_excute([service], TEST_PRIV(), ids), ids); await sleep(2000)
    console.log('service id: ' + ids.get('service::Service'));  

    RpcResultParser.objectids_from_response(protocol, await protocol.sign_excute([guard_withdraw], TEST_PRIV(), ids), ids); await sleep(2000); // guard 1
    RpcResultParser.objectids_from_response(protocol, await protocol.sign_excute([guard_refund], TEST_PRIV(), ids), ids);  await sleep(2000); // guard 2
    RpcResultParser.objectids_from_response(protocol, await protocol.sign_excute([service_publish], TEST_PRIV(), ids), ids);

    console.log(ids); 
}  

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const arbitration = async (protocol:Protocol, param:any) => {
    const permission = Permission.New(protocol.sessionCurrent(), 'arbitration permission');
    const treasury = Treasury.New(protocol.sessionCurrent(), SERVICE_PAY_TYPE, permission.get_object(), 'arbitration treasury');
    const t = Arbitration.New(protocol.sessionCurrent(), SERVICE_PAY_TYPE, permission.get_object(), 'arbitration for goods lost', BigInt(0), treasury.get_object());
    t.pause(false);
    t.launch();
    treasury.launch();
    permission.launch();
}

const service_publish = async (protocol:Protocol, param:any) => {
    const permission = param.get('permission::Permission')[0] ;
    const service = param.get('service::Service')[0];
    Service.From(protocol.sessionCurrent(), SERVICE_PAY_TYPE, permission, service).publish(); 
}

enum BUSINESS { // business permission for Permission Object must >= 1000
    confirmOrder = 1000,
    shipping = 1001,
    express = 1002,
    finance = 1003,
    dispute = 1004,
};


const permission = async (protocol:Protocol, param:any) => {
    const entities:Permission_Entity[] = [
        {address: TESTOR[0].address, permissions: [ {index:BUSINESS.confirmOrder}, ],},
        {address: TESTOR[1].address, permissions: [ {index:BUSINESS.confirmOrder}, {index:BUSINESS.shipping}],},
        {address: TESTOR[2].address, permissions: [ {index:BUSINESS.shipping}],},
        {address: TESTOR[3].address, permissions: [ {index:BUSINESS.express}, ],},
        {address: TESTOR[4].address, permissions: [ {index:BUSINESS.express}, ],},
        {address: TESTOR[5].address, permissions: [ {index:BUSINESS.finance},],},
        {address: TESTOR[6].address, permissions: [ {index:BUSINESS.dispute}, ],},
    ]

    const p = Permission.New(protocol.sessionCurrent(), 'permission test');

    for (const key in BUSINESS) { // add business permissions first.
        if (isNaN(Number(key))) {
            p.add_bizPermission(parseInt(BUSINESS[key]), key)
        }
    }

    p.add_entity(entities);
    p.launch();
}

// machine nodes
const order_confirmation:Machine_Node = {
    name: 'Order confirmation',
    pairs: [
        {prior_node: Machine.INITIAL_NODE_NAME, threshold:0, forwards:[
            {name:'Confirm order', weight: 1, permission:BUSINESS.confirmOrder},
        ]},
    ]
}
const order_cancellation:Machine_Node = {
    name: 'Order cancellation',
    pairs: [
        {prior_node: Machine.INITIAL_NODE_NAME, threshold:0, forwards:[
            {name:'Payer cancels', weight: 1, namedOperator:Machine.OPERATOR_ORDER_PAYER},
            {name:'Seller cancels', weight: 1, permission:BUSINESS.confirmOrder},
        ]},
    ]
}
const goods_shippedout:Machine_Node = {
    name: 'Goods shipped out',
    pairs: [
        {prior_node: 'Order confirmation', threshold:10, forwards:[
            {name:'Express pickup', weight: 5, permission:BUSINESS.express},
            {name:'Seller Ships', weight: 5, permission:BUSINESS.shipping},
        ]},
    ]
}

const order_completed:Machine_Node = {
    name: 'Order completed',
    pairs: [
        {prior_node: 'Goods shipped out', threshold:10, forwards:[
            {name:'Payer sign', weight: 10, namedOperator:Machine.OPERATOR_ORDER_PAYER},
            {name:'Expdress comfirms', weight: 5, permission:BUSINESS.express},
            {name:'Shipper comfirms after 15 days', weight: 5, permission:BUSINESS.shipping},
        ]},
        {prior_node: 'Dispute', threshold:10, forwards:[
            {name:'Payer comfirms', weight: 6, namedOperator:Machine.OPERATOR_ORDER_PAYER},
            {name:'Expdress comfirms', weight: 4, permission:BUSINESS.express},
            {name:'Seller comfirms', weight: 4, permission:BUSINESS.dispute},
        ]},
    ]
}

const return_goods: Machine_Node = {
    name: 'Goods Returned',
    pairs: [
        {prior_node: 'Order completed', threshold:15, forwards:[
            {name:'Payer request', weight: 5, namedOperator:Machine.OPERATOR_ORDER_PAYER},
            {name:'Seller comfirms', weight: 5, permission:BUSINESS.confirmOrder},
            {name:'Expdress comfirms', weight: 5, permission:BUSINESS.express},
        ]},
        {prior_node: 'Dispute', threshold:15, forwards:[
            {name:'Payer request', weight: 5, namedOperator:Machine.OPERATOR_ORDER_PAYER},
            {name:'Seller comfirms', weight: 5, permission:BUSINESS.confirmOrder},
            {name:'Expdress comfirms', weight: 5, permission:BUSINESS.express},
        ]},
    ]
}
/*
const Return_goods_completed: Machine_Node = {
    name: 'Goods Returned Completed',
    pairs: [
        {prior_node: 'Goods Returned', threshold:10, forwards:[
            {name:'Seller comfirms', weight: 5, permission:BUSINESS.confirmOrder},
            {name:'Expdress comfirms', weight: 5, permission:BUSINESS.express},
        ]},
    ]
}

const Return_goods_lost: Machine_Node = {
    name: 'Goods Returned Lost',
    pairs: [
        {prior_node: 'Goods Returned', threshold:10, forwards:[
            {name:'Seller comfirms', weight: 5, permission:BUSINESS.confirmOrder},
            {name:'Expdress comfirms', weight: 5, permission:BUSINESS.express},
        ]},
    ]
}*/

const goods_lost:Machine_Node = {
    name: 'Goods lost',
    pairs: [
        {prior_node: 'Dispute', threshold:10, forwards:[
            {name:'Seller comfirms', weight: 5, permission:BUSINESS.shipping},
        ]},
        {prior_node: 'Goods shipped out', threshold:10, forwards:[
            {name:'Express comfirms', weight: 5, permission:BUSINESS.express},
            {name:'Seller comfirms', weight: 5, permission:BUSINESS.shipping},
        ]},
    ]
}

const dispute:Machine_Node = {
    name: 'Dispute',
    pairs: [
        {prior_node: 'Order completed', threshold:0, forwards:[
        ]},
    ]
}

// Chain transaction size limit, split into small transactions
const machine = async (protocol:Protocol, ids: Map<string, TxbObject[]>) => {
    const create = (protocol:Protocol, param:any) => {
        const permission = ids.get('permission::Permission')![0] ;
        const m = Machine.New(protocol.sessionCurrent(), permission, 'E-commerce Machine', 'https://wowok.net/');
        m.launch();
    }
    const add = (protocol:Protocol, param:any) => {
        const machine = param.get('machine::Machine')[0] ;
        const permission = ids.get('permission::Permission')![0] ;
        const m = Machine.From(protocol.sessionCurrent(), permission, machine);
        m.add_node([order_confirmation, order_cancellation, order_completed, goods_shippedout, goods_lost, dispute, return_goods]);
    }

    RpcResultParser.objectids_from_response(protocol, await protocol.sign_excute([create], TEST_PRIV(), ids), ids); await sleep(2000);
    RpcResultParser.objectids_from_response(protocol, await protocol.sign_excute([add], TEST_PRIV(), ids), ids); await sleep(2000);
}

const machine_publish = async (protocol:Protocol, param:any) => {
    const machine = param.get('machine::Machine')[0] ;
    const permission = param.get('permission::Permission')[0] ;
    const m = Machine.From(protocol.sessionCurrent(), permission, machine);
    m.publish();
}

const service = async (protocol:Protocol, param:any) => {
    const sales:Service_Sale[] = [
        {item:'Play Purse for Little Girls, 35PCS Toddler Purse with Pretend Makeup for Toddlers, Princess Toys Includes Handbag, Phone, Wallet, Camera, Keys, Kids Purse Birthday Gift for Girls Age 3 4 5 6+', price: '3', stock: '102', endpoint:'https://www.amazon.com/-/zh/dp/B0CC5HY7FW/?_encoding=UTF8&pd_rd_w=WCGMu&content-id=amzn1.sym.4b90c80a-3aee-44a3-b41d-fc2674a3ef63%3Aamzn1.symc.ee4c414f-039b-458d-a009-4479557ca47b&pf_rd_p=4b90c80a-3aee-44a3-b41d-fc2674a3ef63&pf_rd_r=8THXB3PK5QMJY69HTZBT&pd_rd_wg=GncEh&pd_rd_r=cabe72a9-3591-47f1-8cb1-fd10ec2d9db1&ref_=pd_hp_d_btf_ci_mcx_mr_hp_d'}, 
        {item:'Little Girls Purse with Accessories and Pretend Makeup for Toddlers - My First Purse Set Includes Handbag, Phone, Wallet, Play Makeup and More Pretend Play Toys for Girls Age 3 +, Great Gift for Girls', price: '5', stock: '111', endpoint:'https://www.amazon.com/-/zh/dp/B0BJYRT9JL/?_encoding=UTF8&pd_rd_w=WCGMu&content-id=amzn1.sym.4b90c80a-3aee-44a3-b41d-fc2674a3ef63%3Aamzn1.symc.ee4c414f-039b-458d-a009-4479557ca47b&pf_rd_p=4b90c80a-3aee-44a3-b41d-fc2674a3ef63&pf_rd_r=8THXB3PK5QMJY69HTZBT&pd_rd_wg=GncEh&pd_rd_r=cabe72a9-3591-47f1-8cb1-fd10ec2d9db1&ref_=pd_hp_d_btf_ci_mcx_mr_hp_d&th=1'}, 
        {item:'Tree House Building Set, Friendship Treehouse Building Toy for Girls, with Slides, Swing, Animals Creative Forest House Building Brick Kits, Great Gift for Kids Who Love Nature', price: '2', stock: '67', endpoint:'https://www.amazon.com/dp/B0CTHQG2QC/ref=sr_1_1_sspa?__mk_zh_CN=%E4%BA%9A%E9%A9%AC%E9%80%8A%E7%BD%91%E7%AB%99&dib=eyJ2IjoiMSJ9.-74BToXqoNZSYOJd18joki3pJRFcdz2A48Z6SDgyXgdG3ubgYJS56JDSqiHzW9NGNzq35t1UCJDVtB6tjuVa3et20K06IYqBshPc5XMK9hMNOw_bwj2bXcxGURGsD5yYmyC18d1JaqH9mkyRwLmdamSaeEBogjaM4QJV31Xvko4vbMy3elYuCDtOlC_4BQvRiCS5s_cQH_I07eMDAonkmD8-mKVE72HOjqIBWLHPh6apvcLi9ouUUx1PPy8fp7KCbRprsjFzh8EWkGzxjHUQddVvaa4-jDMfkQhMmroAp8s.vc0mkMyz72-tRAlwl2Lzt3ewSdI7BD3Q288AXz8sfHg&dib_tag=se&keywords=%E6%A0%91%E5%B1%8B&qid=1727248906&sr=8-1-spons&sp_csd=d2lkZ2V0TmFtZT1zcF9hdGY&psc=1'}, 
    ]
    const discount_type_a:Service_Discount = {
        name:'Discounts on Select Holiday Gifts',
        price_greater: BigInt(0),
        type:Service_Discount_Type.ratio,
        off: 20,
        duration_minutes: 10000000,        
    }
    const discount_type_b:Service_Discount = {
        name:'Exclusive for old customers',
        price_greater: BigInt(2),
        type:Service_Discount_Type.minus,
        off: 2,
        duration_minutes: 60000000,        
    }
    const discounts_dispatch:DicountDispatch[] = [
        {receiver: TESTOR[5].address, count: 2, discount: discount_type_a},
        {receiver: TESTOR[6].address, count: 2, discount: discount_type_a},
        {receiver: TESTOR[7].address, count: 2, discount: discount_type_a},
    ]

    const permission = param.get('permission::Permission')[0] ;
    const machine = param.get('machine::Machine')[0] ;
    const arbitration = param.get('arbitration::Arbitration')[0];

    const treasury = Treasury.New(protocol.sessionCurrent(), SERVICE_PAY_TYPE, permission, 'Order revenue Treasury');
    const service = Service.New(protocol.sessionCurrent(), SERVICE_PAY_TYPE, permission, 'Top1 Toy Store in US.', treasury.get_object()) ;
    service.set_machine(machine);
    service.add_sales(sales);
    service.discount_transfer(discounts_dispatch);
    service.add_arbitration(arbitration, SERVICE_PAY_TYPE);
    service.set_customer_required("-----BEGIN PUBLIC KEY----- \
            MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCXFyjaaYXvu26BHM4nYQrPhnjL\
            7ZBQhHUyeLo+4GQ6NmjXM3TPH9O1qlRerQ0vihYxVy6u5QbhElsxDNHp6JtRNlFZ \
            qJE0Q/2KEaTTUU9PWtdt5yHY5Tsao0pgd2N4jiPWIx9wNiYJzcvztlbACU91NAif \
            e6QFRLNGdDVy3RMjOwIDAQAB \
            -----END PUBLIC KEY-----", [BuyRequiredEnum.address, BuyRequiredEnum.phone, BuyRequiredEnum.name])
    service.launch();
    treasury.launch();
}

const guard_confirmation_24hrs_more = async (protocol:Protocol, param:any) => {
    const machine = param.get('machine::Machine')[0] ;
    // Receipt will be signed by default 15 days after delivery
    const receipt = new GuardMaker();
    const receipt_progress_witness = receipt.add_constant(ValueType.TYPE_ADDRESS); // witness of Progress
    
    receipt.add_param(ValueType.TYPE_U64, 86400000) // 24 hours
        .add_query(MODULES.progress, 'Last Session Time', receipt_progress_witness)
        .add_logic(OperatorType.TYPE_NUMBER_ADD) // +
        .add_param(ContextType.TYPE_CLOCK) // current tx time
        .add_logic(OperatorType.TYPE_LOGIC_AS_U256_GREATER_EQUAL) // 1: current tx time >= (last session time + 24hrs)

        .add_param(ValueType.TYPE_STRING, order_confirmation.name)
        .add_query(MODULES.progress, 'Current Node', receipt_progress_witness)
        .add_logic(OperatorType.TYPE_LOGIC_EQUAL) // 2: current node equals order_confirmation

        .add_param(ValueType.TYPE_ADDRESS, machine) 
        .add_query(MODULES.progress, 'Machine', receipt_progress_witness) 
        .add_logic(OperatorType.TYPE_LOGIC_EQUAL) // 3: progress'machine equals this machine

        .add_logic(OperatorType.TYPE_LOGIC_AND, 3); // 1 and 2 and 3
    const guard = Guard.New(protocol.sessionCurrent(), 'current on node '+order_confirmation.name+ ' and current tx time >= (last session time + 24hrs)', receipt.build());
    const permission = param.get('permission::Permission')[0] ;
    const m = Machine.From(protocol.sessionCurrent(), permission, machine);
    const cancel:Machine_Forward = {name:'Goods not shipped for more than 24 hours', weight: 1, namedOperator:Machine.OPERATOR_ORDER_PAYER, 
        guard:{guard:guard.get_object(), order_ids:[]}};
    m.add_forward(order_confirmation.name, order_cancellation.name, cancel); 
    guard.launch()
}

const guard_receipt = async (protocol:Protocol, param:any) => {
    const machine = param.get('machine::Machine')[0] ;
    // Receipt will be signed by default 15 days after delivery
    const receipt = new GuardMaker();
    const receipt_progress_witness = receipt.add_constant(ValueType.TYPE_ADDRESS); // witness of Progress
    receipt.add_param(ValueType.TYPE_U64, 1296000000) // 15 days
        .add_query(MODULES.progress, 'Last Session Time', receipt_progress_witness)
        .add_logic(OperatorType.TYPE_NUMBER_ADD) // +
        .add_param(ContextType.TYPE_CLOCK) // current tx time
        .add_logic(OperatorType.TYPE_LOGIC_AS_U256_GREATER_EQUAL) // 1: current tx time >= (last session time + 15 days)

        .add_param(ValueType.TYPE_STRING, goods_shippedout.name)
        .add_query(MODULES.progress, 'Current Node', receipt_progress_witness)
        .add_logic(OperatorType.TYPE_LOGIC_EQUAL) // 2: current node equals goods_shippedout

        .add_param(ValueType.TYPE_ADDRESS, machine) 
        .add_query(MODULES.progress, 'Machine', receipt_progress_witness) 
        .add_logic(OperatorType.TYPE_LOGIC_EQUAL) // 3: progress'machine equals this machine
        .add_logic(OperatorType.TYPE_LOGIC_AND, 3); // 1 and 2 and 3
    const guard = Guard.New(protocol.sessionCurrent(), 'current on node '+goods_shippedout.name+ ' and current tx time >= (last session time + 15 days)', receipt.build());
    const permission = param.get('permission::Permission')[0] ;
    const m = Machine.From(protocol.sessionCurrent(), permission, machine);
    const shipper_with_guard:Machine_Forward = {name:'Shipper comfirms after 15 days', weight: 5, permission:BUSINESS.shipping, 
        guard:{guard:guard.get_object(), order_ids:[]}};
    m.add_forward(goods_shippedout.name, order_completed.name, shipper_with_guard);
    guard.launch()
}

const guard_withdraw = async (protocol:Protocol, param:any) => {
    const machine = param.get('machine::Machine')[0] ;
    const arbitration = param.get('arbitration::Arbitration')[0];

    // withdraw guard: order completed or arbitrition
    const withdraw = new GuardMaker();
    const withdraw_progress_witness = withdraw.add_constant(ValueType.TYPE_ADDRESS);
    const withdraw_completed = withdraw.add_constant(ValueType.TYPE_STRING, order_completed.name);

    withdraw.add_param(ContextType.TYPE_CONSTANT, withdraw_completed)
        .add_query(MODULES.progress, 'Current Node', withdraw_progress_witness)
        .add_logic(OperatorType.TYPE_LOGIC_EQUAL) 

        .add_param(ValueType.TYPE_ADDRESS, machine) 
        .add_query(MODULES.progress, 'Machine', withdraw_progress_witness) 
        .add_logic(OperatorType.TYPE_LOGIC_EQUAL) 

        .add_param(ValueType.TYPE_U64, 1296000000) // 15 days
        .add_query(MODULES.progress, 'Last Session Time', withdraw_progress_witness)
        .add_logic(OperatorType.TYPE_NUMBER_ADD, 2) // +
        .add_param(ContextType.TYPE_CLOCK) // current tx time
        .add_logic(OperatorType.TYPE_LOGIC_AS_U256_GREATER_EQUAL) // current tx time >= (last session time + 15 days) */

        .add_logic(OperatorType.TYPE_LOGIC_AND, 3) 

    const withdraw2 = new GuardMaker();
    const withdraw2_dispute = withdraw2.add_constant(ValueType.TYPE_STRING, dispute.name);   
    const withdraw2_progress_witness = withdraw2.add_constant(ValueType.TYPE_ADDRESS);

    withdraw2.add_param(ContextType.TYPE_CONSTANT, withdraw2_dispute)
    .add_query(MODULES.progress, 'Current Node', withdraw2_progress_witness)
    .add_logic(OperatorType.TYPE_LOGIC_EQUAL) 

    .add_param(ValueType.TYPE_ADDRESS, machine) 
    .add_query(MODULES.progress, 'Machine', withdraw2_progress_witness) 
    .add_logic(OperatorType.TYPE_LOGIC_EQUAL) 

    .add_param(ValueType.TYPE_U64, 2592000000) // 30 days
    .add_query(MODULES.progress, 'Last Session Time', withdraw2_progress_witness)
    .add_logic(OperatorType.TYPE_NUMBER_ADD) // +
    .add_param(ContextType.TYPE_CLOCK) // current tx time
    .add_logic(OperatorType.TYPE_LOGIC_AS_U256_GREATER_EQUAL) // current tx time >= (last session time + 30 days) */

    .add_logic(OperatorType.TYPE_LOGIC_AND, 3) 

    const permission = param.get('permission::Permission')[0] ;
    const service = param.get('service::Service')[0] ;
    var desp = 'Widthdraw on status: '+order_completed.name+' more than 15 days; \nService: '+service;
    const guard = Guard.New(protocol.sessionCurrent(), desp, withdraw.build());

    var desp2 = 'Widthdraw on status: '+dispute.name+' Wait 30 days to receive the results of a trusted Arbitration ' + arbitration +'. And within 30 days, the user can initiate a refund at any time based on the Arb arbitration results.';
    const guard2 = Guard.New(protocol.sessionCurrent(), desp2, withdraw2.build());
    Service.From(protocol.sessionCurrent(), SERVICE_PAY_TYPE, permission, service).add_withdraw_guards([{guard:guard.get_object(), rate:10000}, {guard:guard2.get_object(), rate:10000}, ]);
    guard.launch(); guard2.launch(); 
}

const guard_payer_lost = async (protocol:Protocol, param:any) => {
    const machine = param.get('machine::Machine')[0] ;

    // Receipt will be signed by default 15 days after delivery
    const maker = new GuardMaker();
    const progress = maker.add_constant(ValueType.TYPE_ADDRESS); // witness of Progress

    maker.add_param(ValueType.TYPE_U64, 1296000000) // 15 days
        .add_query(MODULES.progress, 'Last Session Time', progress)
        .add_logic(OperatorType.TYPE_NUMBER_ADD) // +
        .add_param(ContextType.TYPE_CLOCK) // current tx time
        .add_logic(OperatorType.TYPE_LOGIC_AS_U256_LESSER_EQUAL) // 1: current tx time <= (last session time + 15 days)

        .add_param(ValueType.TYPE_STRING, order_completed.name)
        .add_query(MODULES.progress, 'Current Node', progress)
        .add_logic(OperatorType.TYPE_LOGIC_EQUAL) // 2: current node equals order_completed

        .add_param(ValueType.TYPE_ADDRESS, machine) 
        .add_query(MODULES.progress, 'Machine', progress) 
        .add_logic(OperatorType.TYPE_LOGIC_EQUAL) // 3: progress'machine equals this machine
        .add_logic(OperatorType.TYPE_LOGIC_AND, 3); // 1 and 2 and 3
    const guard = Guard.New(protocol.sessionCurrent(), 'current on node '+order_completed.name+ ' and current tx time <= (last session time + 15 days)', maker.build());
    const permission = param.get('permission::Permission')[0] ;
    const m = Machine.From(protocol.sessionCurrent(), permission, machine);
    const f:Machine_Forward = {name:'Confirm no package received within 15 days', weight: 1, namedOperator:Machine.OPERATOR_ORDER_PAYER, 
        guard:{guard:guard.get_object(), order_ids:[]}};
    m.add_forward(order_completed.name, dispute.name, f); 
    guard.launch()
}

const guard_refund = async (protocol:Protocol, param:any) => {
    const machine = param.get('machine::Machine')[0] ;

    // refund guard: order canceled or goods lost
    const refund = new GuardMaker();
    const refund_progress_witness = refund.add_constant(ValueType.TYPE_ADDRESS);
    const refund_canceled = refund.add_constant(ValueType.TYPE_STRING, order_cancellation.name);
    const refund_goods_lost = refund.add_constant(ValueType.TYPE_STRING, goods_lost.name);

    refund.add_param(ContextType.TYPE_CONSTANT, refund_canceled)
        .add_query(MODULES.progress, 'Current Node', refund_progress_witness)
        .add_logic(OperatorType.TYPE_LOGIC_EQUAL) 

        .add_param(ContextType.TYPE_CONSTANT, refund_goods_lost)
        .add_query(MODULES.progress, 'Current Node', refund_progress_witness)
        .add_logic(OperatorType.TYPE_LOGIC_EQUAL)

        .add_logic(OperatorType.TYPE_LOGIC_OR, 2) // 'order at cancel or goods lost node 

        .add_param(ValueType.TYPE_ADDRESS, machine) 
        .add_query(MODULES.progress, 'Machine', refund_progress_witness) 
        .add_logic(OperatorType.TYPE_LOGIC_EQUAL) 

        .add_logic(OperatorType.TYPE_LOGIC_AND, 2);  // and  

    const refund2 = new GuardMaker();
    const refund2_progress_witness = refund2.add_constant(ValueType.TYPE_ADDRESS);
    const refund2_return_goods = refund2.add_constant(ValueType.TYPE_STRING, return_goods.name);

    refund2.add_param(ContextType.TYPE_CONSTANT, refund2_return_goods)
        .add_query(MODULES.progress, 'Current Node', refund2_progress_witness)
        .add_logic(OperatorType.TYPE_LOGIC_EQUAL) 

        .add_param(ValueType.TYPE_ADDRESS, machine) 
        .add_query(MODULES.progress, 'Machine', refund2_progress_witness) 
        .add_logic(OperatorType.TYPE_LOGIC_EQUAL) 

        .add_param(ValueType.TYPE_U64, 1296000000) // 15 days
        .add_query(MODULES.progress, 'Last Session Time', refund2_progress_witness)
        .add_logic(OperatorType.TYPE_NUMBER_ADD) // +
        .add_param(ContextType.TYPE_CLOCK) // current tx time
        .add_logic(OperatorType.TYPE_LOGIC_AS_U256_LESSER_EQUAL) // 1: current tx time <= (last session time + 15 days)

        .add_logic(OperatorType.TYPE_LOGIC_AND, 3);  // and  
    const permission = param.get('permission::Permission')[0] ;
    const service = param.get('service::Service')[0] ;
    const guard = Guard.New(protocol.sessionCurrent(), 'Refund Guard for Machine nodes for Service: ' + service, refund.build());
    const guard2 = Guard.New(protocol.sessionCurrent(), 'By default, returns have been delivered more than 15 days for Service: ' + service, refund2.build());
    Service.From(protocol.sessionCurrent(), SERVICE_PAY_TYPE, permission, service).add_refund_guards([{guard:guard.get_object(), rate:10000}, {guard:guard2.get_object(), rate:10000}]);
    guard.launch(); guard2.launch();
}

const guard_lost_comfirm_compensate = async (protocol:Protocol, param:any) => {
    const machine = param.get('machine::Machine')[0] ;
    const maker = new GuardMaker();
    const progress = maker.add_constant(ValueType.TYPE_ADDRESS);
    const payment = maker.add_constant(ValueType.TYPE_ADDRESS);
    const order = maker.add_constant(ValueType.TYPE_ADDRESS)
    maker.add_query(MODULES.progress, 'Last Session Time', progress)
        .add_param(ValueType.TYPE_U64, 86400000) // 24 hours
        .add_logic(OperatorType.TYPE_NUMBER_ADD) 
        .add_param(ContextType.TYPE_CLOCK)
        .add_logic(OperatorType.TYPE_LOGIC_AS_U256_GREATER) // 1: tx time > (last session time  + 24 hrs)
        
        .add_query(MODULES.order, 'Progress', order)
        .add_param(ContextType.TYPE_CONSTANT, progress)
        .add_logic(OperatorType.TYPE_LOGIC_EQUAL) // 2: ralationship: order's progress
        .add_query(MODULES.payment, 'Guard for Perpose', payment)
        .add_param(ContextType.TYPE_GUARD)
        .add_logic(OperatorType.TYPE_LOGIC_EQUAL)
        .add_query(MODULES.payment, 'Biz-ID', payment)
        .add_query(MODULES.progress, 'Current Session-id', progress)
        .add_logic(OperatorType.TYPE_LOGIC_EQUAL)
        .add_query(MODULES.order, 'Payer', order)
        .add_query(MODULES.payment, 'Amount for a Recipient', payment)
        .add_param(ValueType.TYPE_U64, 100000000)
        .add_logic(OperatorType.TYPE_LOGIC_AS_U256_LESSER_EQUAL) 
        .add_logic(OperatorType.TYPE_LOGIC_AND, 3)  // 3: payment: for this guard usage && progress session id matchs && compensation > 100000000
        .add_logic(OperatorType.TYPE_LOGIC_AND, 3)  // 4: 1 && 2 && 3
        .add_query(MODULES.progress, 'Last Session Time', progress)
        .add_param(ValueType.TYPE_U64, 86400000) // 24 hours
        .add_logic(OperatorType.TYPE_NUMBER_ADD) 
        .add_param(ContextType.TYPE_CLOCK)
        .add_logic(OperatorType.TYPE_LOGIC_AS_U256_LESSER_EQUAL) // 5: tx time <= (last session time  + 24 hrs) : No compensation required
        .add_logic(OperatorType.TYPE_LOGIC_OR, 2); // 6: 4 || 5
    var desp = order_completed.name+'->'+goods_lost.name+':\n';
    desp += '1: Compensation 100000000 to order payer for responsing exceeding 24 hours;\n';
    desp += '2: If the status is resolved within 24 hours, no compensation will be required.';
    const guard = Guard.New(protocol.sessionCurrent(), desp, maker.build());
    const permission = param.get('permission::Permission')[0] ;
    const m = Machine.From(protocol.sessionCurrent(), permission, machine);
    const express:Machine_Forward = {name:'Response within 24hrs if package lost', weight: 5, permission:BUSINESS.express, 
        guard:{guard:guard.get_object(), order_ids:[]}};
    m.add_forward(dispute.name, goods_lost.name, express);
    guard.launch()
}


main().catch(console.error)