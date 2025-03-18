
/**
 * Simple Insurance Service
 */

import { CallGuard_Data, CallMachine_Data, 
    CallPermission_Data, CallRepository_Data, CallService_Data, WOWOK } from 'wowok_agent'
import { sleep, TESTOR, TEST_ADDR, launch, PAY_TYPE, PUBKEY } from './common';

enum BUSINESS { // business permission for Permission Object must >= 1000
    adjuster = 1000,
    finance = 1001,
};

enum MACHINE_NODE {
    Report_Incident = 'Report Incident',
    Emergency_Treatment = 'Emergency Treatment',
    Amount_claim = 'Amount Claim',
    Insurance_Payment = 'Insurance Payment',
}

const MEDICAL_ORG = 'medical organization';

const Report_Incident:WOWOK.Machine_Node = {
    name: MACHINE_NODE.Report_Incident,
    pairs: [
        {prior_node: WOWOK.Machine.INITIAL_NODE_NAME, threshold:2, forwards:[
            {name:'Notify insurer within 24 hours', weight: 1, namedOperator:WOWOK.Machine.OPERATOR_ORDER_PAYER},
        ]},
    ]
}

const Emergency_Treatment:WOWOK.Machine_Node = {
    name: MACHINE_NODE.Emergency_Treatment,
    pairs: [
        {prior_node: MACHINE_NODE.Report_Incident, threshold:2, forwards:[
            {name:'Confirmation visit', weight: 1, namedOperator:WOWOK.Machine.OPERATOR_ORDER_PAYER},
            {name:'Medical fees', weight: 1, namedOperator:MEDICAL_ORG},
        ]},
    ]
}

const Amount_claim:WOWOK.Machine_Node = {
    name: MACHINE_NODE.Amount_claim,
    pairs: [
        {prior_node: MACHINE_NODE.Emergency_Treatment, threshold:2, forwards:[
            {name:'Confirmation amount', weight: 1, namedOperator:WOWOK.Machine.OPERATOR_ORDER_PAYER},
        ]},
    ]
}

const Insurance_Payment:WOWOK.Machine_Node = {
    name: MACHINE_NODE.Insurance_Payment,
    pairs: [
        {prior_node: MACHINE_NODE.Amount_claim, threshold:0, forwards:[
        ]},
    ]
}

export const insurance = async () : Promise<string> => {
    const permission_id = await permission(); await sleep(2000)
    if (!permission_id)  WOWOK.ERROR(WOWOK.Errors.Fail, 'permission object failed.')
    
    const repository_id = await repository(permission_id!); await sleep(2000)
    if (!repository_id) WOWOK.ERROR(WOWOK.Errors.Fail, 'arbitration object failed.')

    const machine_id = await machine(permission_id!); await sleep(2000)
    if (!machine_id) WOWOK.ERROR(WOWOK.Errors.Fail, 'machine object failed.')
    await machine_guards_and_publish(machine_id!, permission_id!, repository_id!); 
    
    const service_id = await service(machine_id!, permission_id!, repository_id!);
    if (!service_id) WOWOK.ERROR(WOWOK.Errors.Fail, 'service object failed.')
    await service_guards_and_publish(machine_id!, permission_id!, service_id!)
    return service_id!
}

const repository = async (permission_id:string) : Promise<string | undefined> => {
    const policy : WOWOK.Repository_Policy[] = [
    { key:'amount', description:'Payout amount', dataType:WOWOK.RepositoryValueType.PositiveNumber, permissionIndex:BUSINESS.adjuster
    }, { key:'report', description:'Accident report', dataType:WOWOK.RepositoryValueType.String, permissionIndex:BUSINESS.adjuster
    }];

    const data : CallRepository_Data = {
        description:'payout records', permission:{address:permission_id},
        mode:WOWOK.Repository_Policy_Mode.POLICY_MODE_STRICT,
        policy:{op:'add', data:policy},
    }
    return await launch('Repository', data);
}

const service = async (machine_id:string, permission_id:string, repository_id:string) : Promise<string | undefined> => {
    const sales:WOWOK.Service_Sale[] = [
        {item:'Outdoor accident insurance', price: '5', stock: '102', endpoint:'https://x4o43luhbc.feishu.cn/docx/IyA4dUXx1o6ilDxQMMKc3CoonGd?from=from_copylink'}, 
    ]

    const data: CallService_Data = { object:{namedNew:{name:'shop service'}}, permission:{address:permission_id}, type_parameter:PAY_TYPE,
        description:'Outdoor accident insurance', machine:machine_id, payee_treasury:{namedNew:{name:'Outdoor accident insurance treasury'}},
        repository:{op:'add', repositories:[repository_id]},
        customer_required_info:{pubkey:PUBKEY, required_info:[
                WOWOK.BuyRequiredEnum.address, WOWOK.BuyRequiredEnum.phone, WOWOK.BuyRequiredEnum.name
            ]}, sales:{op:'add', sales:sales}, endpoint:'https://x4o43luhbc.feishu.cn/docx/IyA4dUXx1o6ilDxQMMKc3CoonGd?from=from_copylink'
    }
    return await launch('Service', data)
}

const machine_guards_and_publish = async (machine_id:string, permission_id:string, repository_id:string) => {
    await guard_accident_recorded(machine_id, permission_id, repository_id);
    await guard_amount_claim(machine_id, permission_id, repository_id);
    await guard_insurance_payment(machine_id, permission_id, repository_id);
    const data : CallMachine_Data = { object:{address:machine_id}, permission:{address:permission_id},
        bPublished:true
    }
    await launch('Machine', data) // add new forward to machine
}

const service_guards_and_publish = async (machine_id:string, permission_id:string, service_id:string) => {
    const data1 : CallGuard_Data = {namedNew:{},
        description:'Widthdraw on status: '+MACHINE_NODE.Insurance_Payment+service_id,
        table:[{identifier:1, bWitness:true, value_type:WOWOK.ValueType.TYPE_ADDRESS}, // progress witness
            {identifier:2, bWitness:false, value_type:WOWOK.ValueType.TYPE_ADDRESS, value:machine_id} // machine
        ], 
        root: {logic:WOWOK.OperatorType.TYPE_LOGIC_AND, parameters:[ // progress'machine equals this machine
            {logic:WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters:[
                {query:800, object:1, parameters:[]}, // progress.machine
                {identifier:2}
            ]},
            {logic:WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters:[ // current node == order_completed
                {query:'Current Node', object:1, parameters:[]}, 
                {value_type:WOWOK.ValueType.TYPE_STRING, value:MACHINE_NODE.Insurance_Payment}
            ]}
        ]}
    };

    const guard_id = await launch('Guard', data1);
    if (!guard_id) WOWOK.ERROR(WOWOK.Errors.Fail, 'guard_service_withdraw');

    const data2 : CallService_Data = { object:{address:service_id}, permission:{address:permission_id}, type_parameter:PAY_TYPE,
        withdraw_guard:{op:'add', guards:[{guard:guard_id!, percent:100},]}, bPublished:true
    }
    await launch('Service', data2)
}

const guard_accident_recorded = async (machine_id:string, permission_id:string, repository_id:string) => {
    const data : CallGuard_Data = {namedNew:{},
        description:'Record incident report',
        table:[{identifier:1, bWitness:true, value_type:WOWOK.ValueType.TYPE_ADDRESS}, // progress witness
        ], 
        root: {logic:WOWOK.OperatorType.TYPE_LOGIC_AND, parameters:[ 
            {query:105, object:repository_id, parameters:[ // repository contains report for the progress?
                {identifier:1},// progress id
                {value:'report', value_type:WOWOK.ValueType.TYPE_STRING} 
            ]},
            {logic:WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters:[
                {query:800, object:1, parameters:[]}, // progress.machine
                {value:machine_id, value_type:WOWOK.ValueType.TYPE_ADDRESS} // machine id
            ]},
        ]}
    };
    const guard_id = await launch('Guard', data);
    if (!guard_id) WOWOK.ERROR(WOWOK.Errors.Fail, 'guard_accident_recorded');

    const data2 : CallMachine_Data = { object:{address:machine_id}, permission:{address:permission_id},
        nodes:{op:'add forward', data:[{prior_node_name:WOWOK.Machine.INITIAL_NODE_NAME, node_name:MACHINE_NODE.Report_Incident,
            forward:{name:'Record incident report', weight: 1, permission:BUSINESS.adjuster, guard:guard_id}
        }]}
    }
    await launch('Machine', data2) // add new forward to machine
}

const guard_amount_claim = async (machine_id:string, permission_id:string, repository_id:string) => {
    const data : CallGuard_Data = {namedNew:{},
        description:'Record incident report',
        table:[{identifier:1, bWitness:true, value_type:WOWOK.ValueType.TYPE_ADDRESS}, // progress witness
        ], 
        root: {logic:WOWOK.OperatorType.TYPE_LOGIC_AND, parameters:[ 
            {query:105, object:repository_id, parameters:[ // repository contains amount for the progress?
                {identifier:1},// progress id
                {value:'amount', value_type:WOWOK.ValueType.TYPE_STRING} 
            ]},
            {logic:WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters:[
                {query:800, object:1, parameters:[]}, // progress.machine
                {value:machine_id, value_type:WOWOK.ValueType.TYPE_ADDRESS} // machine id
            ]},
        ]}
    };
    const guard_id = await launch('Guard', data);
    if (!guard_id) WOWOK.ERROR(WOWOK.Errors.Fail, 'guard_amount_claim');

    const data2 : CallMachine_Data = { object:{address:machine_id}, permission:{address:permission_id},
        nodes:{op:'add forward', data:[{prior_node_name:MACHINE_NODE.Emergency_Treatment, node_name:MACHINE_NODE.Amount_claim,
            forward:{name:'The claim cost is determined', weight: 1, permission:BUSINESS.adjuster, guard:guard_id}
        }]}
    }
    await launch('Machine', data2) // add new forward to machine
}

const guard_insurance_payment = async (machine_id:string, permission_id:string, repository_id:string) => {
    const data : CallGuard_Data = {namedNew:{},
        description:'Claim insurance payment',
        table:[{identifier:1, bWitness:true, value_type:WOWOK.ValueType.TYPE_ADDRESS}, // progress witness
            {identifier:2, bWitness:true, value_type:WOWOK.ValueType.TYPE_ADDRESS}, // payment witness
            {identifier:3, bWitness:true, value_type:WOWOK.ValueType.TYPE_ADDRESS} // order witness
        ], 
        root: {logic:WOWOK.OperatorType.TYPE_LOGIC_AND, parameters:[ // progress'machine equals this machine
            {logic:WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters:[
                {query:800, object:1, parameters:[]}, // progress.machine
                {value_type:WOWOK.ValueType.TYPE_ADDRESS, value:machine_id}
            ]},
            {logic:WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters:[
                {query:1206, object: 2, parameters:[]}, // payment.Object for Perpose 
                {identifier:1} // this progress
            ]},
            {logic:WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters:[
                {query:1205, object: 2, parameters:[]}, // payment.Guard for Perpose
                {context:WOWOK.ContextType.TYPE_GUARD} // this guard verifying
            ]},
            {logic:WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters:[
                {query:1213, object: 2, parameters:[]}, // payment.Biz-ID
                {query:812, object: 1, parameters:[]}, // progress.Current Session-id
            ]},
            {logic:WOWOK.OperatorType.TYPE_LOGIC_AS_U256_GREATER_EQUAL, parameters:[ // had payed 1000000 at least to order payer, for this progress session
                {query:1209, object: 2, parameters:[ // payment.Amount for a Recipient
                    {query:501, object:3, parameters:[]}, // order.payer
                ]},
                {query:112, object:repository_id, parameters:[// amount
                    {identifier:1},
                    {value:'amount', value_type:WOWOK.ValueType.TYPE_STRING}
                ]}
            ]},
            {logic:WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters:[ // order.progress = this progress
                {query:504, object: 3, parameters:[]}, // oerder.progress
                {identifier:1} // progress witness
            ]},
        ]}
    };
    const guard_id = await launch('Guard', data);
    if (!guard_id) WOWOK.ERROR(WOWOK.Errors.Fail, 'guard_insurance_payment');

    const data2 : CallMachine_Data = { object:{address:machine_id}, permission:{address:permission_id},
        nodes:{op:'add forward', data:[{prior_node_name:MACHINE_NODE.Amount_claim, node_name:MACHINE_NODE.Insurance_Payment,
            forward:{name:'Claim insurance payment', weight: 1, permission:BUSINESS.finance, guard:guard_id}
        }]}
    }
    await launch('Machine', data2) // add new forward to machine
}

const permission = async () : Promise<string | undefined>=> {
    const biz : WOWOK.BizPermission[] = [];
    for (const key in BUSINESS) { // add business permissions first.
        if (isNaN(Number(key))) {
           biz.push({index:parseInt(BUSINESS[key]), name:key})
        }
    }
    const data : CallPermission_Data = { description: 'Outdoor accident insurance',  object:{namedNew:{name:'insurance permission'}},
        biz_permission:{op:'add', data:biz},
        permission:{op:'add entity', entities:[
            {address: TESTOR[0].address, permissions: [ {index:BUSINESS.adjuster}, ],},
            {address: TESTOR[1].address, permissions: [ {index:BUSINESS.adjuster}, ],},
            {address: TESTOR[2].address, permissions: [ {index:BUSINESS.finance}],},
        ]},
        admin:{op:'add', address:[TEST_ADDR()]}
    }
    return await launch('Permission', data);
}

const machine = async (permission_id:string) : Promise<string | undefined>=> {
    const data : CallMachine_Data = { description: 'machine for an insurance',  object:{namedNew:{name:'machine'}},
        permission:{address:permission_id}, endpoint:'https://x4o43luhbc.feishu.cn/docx/IyA4dUXx1o6ilDxQMMKc3CoonGd?from=from_copylink',
        nodes:{op:'add', data:[Report_Incident, Emergency_Treatment, Amount_claim, Amount_claim, Insurance_Payment]}
    }
    return await launch('Machine', data);
}

