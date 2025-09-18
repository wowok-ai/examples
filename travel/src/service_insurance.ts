
/**
 * Simple Insurance Service
 */

import { call_guard, call_machine, call_permission, call_repository, call_service, CallGuard_Data, CallMachine_Data, 
    CallPermission_Data, CallRepository_Data, CallService_Data, WOWOK, Machine_Node } from 'wowok_agent'
import { sleep, TESTOR, TEST_ADDR, result, PAY_TYPE, PUBKEY, INSURANCE_PRODUCT, ServiceReturn } from './common';
import { ContextType, ValueType } from '../../../wowok/dist';

enum BUSINESS { // business permission for Permission Object must >= 1000
    adjuster = 1000,
    finance = 1001,
};

export enum INSURANCE_MACHINE_NODE {
    Report_Incident = 'Report Incident',
    Emergency_Treatment = 'Emergency Treatment',
    Amount_claim = 'Amount Claim',
    Insurance_Payment = 'Insurance Payment',
}

const MEDICAL_ORG = 'medical organization';

const Report_Incident:Machine_Node = {
    name: INSURANCE_MACHINE_NODE.Report_Incident,
    pairs: [
        {prior_node: WOWOK.Machine.INITIAL_NODE_NAME, threshold:2, forwards:[
            {name:'Notify insurer within 24 hours', weight: 1, namedOperator:WOWOK.Machine.OPERATOR_ORDER_PAYER},
        ]},
    ]
}

const Emergency_Treatment:Machine_Node = {
    name: INSURANCE_MACHINE_NODE.Emergency_Treatment,
    pairs: [
        {prior_node: INSURANCE_MACHINE_NODE.Report_Incident, threshold:2, forwards:[
            {name:'Confirmation visit', weight: 1, namedOperator:WOWOK.Machine.OPERATOR_ORDER_PAYER},
            {name:'Medical fees', weight: 1, namedOperator:MEDICAL_ORG},
        ]},
    ]
}

const Amount_claim:Machine_Node = {
    name: INSURANCE_MACHINE_NODE.Amount_claim,
    pairs: [
        {prior_node: INSURANCE_MACHINE_NODE.Emergency_Treatment, threshold:2, forwards:[
            {name:'Confirmation amount', weight: 1, namedOperator:WOWOK.Machine.OPERATOR_ORDER_PAYER},
        ]},
    ]
}

const Insurance_Payment:Machine_Node = {
    name: INSURANCE_MACHINE_NODE.Insurance_Payment,
    pairs: [
        {prior_node: INSURANCE_MACHINE_NODE.Amount_claim, threshold:0, forwards:[
        ]},
    ]
}

export const insurance = async () : Promise<ServiceReturn> => {
    const permission_id = await permission(); await sleep(2000)
    if (!permission_id)  WOWOK.ERROR(WOWOK.Errors.Fail, 'permission object failed.')
    const repository_id = await repository(permission_id!); await sleep(2000)
    if (!repository_id) WOWOK.ERROR(WOWOK.Errors.Fail, 'repository object failed.')
    const machine_id = await machine(permission_id!); await sleep(2000)
    if (!machine_id) WOWOK.ERROR(WOWOK.Errors.Fail, 'machine object failed.')
    await machine_guards_and_publish(machine_id!, permission_id!, repository_id!); 
    const service_id = await service(machine_id!, permission_id!, repository_id!);
    if (!service_id) WOWOK.ERROR(WOWOK.Errors.Fail, 'service object failed.')
    await service_guards_and_publish(machine_id!, permission_id!, service_id!)
    return {service:service_id!, machine:machine_id!}
}

const repository = async (permission_id:string) : Promise<string | undefined> => {
    const policy : WOWOK.Repository_Policy[] = [
    { key:'amount', description:'Payout amount', dataType:WOWOK.RepositoryValueType.PositiveNumber, permissionIndex:BUSINESS.adjuster
    }, { key:'report', description:'Accident report', dataType:WOWOK.RepositoryValueType.String, permissionIndex:BUSINESS.adjuster
    }];

    const data : CallRepository_Data = { object:{permission:permission_id},
        description:'payout records', mode:WOWOK.Repository_Policy_Mode.POLICY_MODE_STRICT,
        policy:{op:'add', data:policy},
    }
    const r = await call_repository({data:data}); 
    return await result('Repository', r) as string;

}

const service = async (machine_id:string, permission_id:string, repository_id:string) : Promise<string | undefined> => {
    const data: CallService_Data = { object:{permission:permission_id, type_parameter:PAY_TYPE},
        description:'Outdoor accident insurance', machine:machine_id, payee_treasury:{name:'Outdoor accident insurance treasury'},
        repository:{op:'add', objects:[repository_id]},
        customer_required_info:{pubkey:PUBKEY, required_info:[
                WOWOK.BuyRequiredEnum.address, WOWOK.BuyRequiredEnum.phone, WOWOK.BuyRequiredEnum.name
            ]}, sales:{op:'add', sales:[INSURANCE_PRODUCT]}, endpoint:'https://x4o43luhbc.feishu.cn/docx/IyA4dUXx1o6ilDxQMMKc3CoonGd?from=from_copylink'
    }
    const r = await call_service({data:data});
    return await result('Service', r) as string
}

const machine_guards_and_publish = async (machine_id:string, permission_id:string, repository_id:string) => {
    await guard_accident_recorded(machine_id, permission_id, repository_id);
    await guard_amount_claim(machine_id, permission_id, repository_id);
    await guard_insurance_payment(machine_id, permission_id, repository_id);
    const data : CallMachine_Data = { object:machine_id, bPublished:true}
    await result('Machine', await call_machine({data:data})) // add new forward to machine
}

const service_guards_and_publish = async (machine_id:string, permission_id:string, service_id:string) => {
    const data1 : CallGuard_Data = {namedNew:{},
        description:'Widthdraw on status: '+INSURANCE_MACHINE_NODE.Insurance_Payment+' for service '+service_id,
        table:[{identifier:1, bWitness:true, value_type:WOWOK.ValueType.TYPE_ADDRESS}, // progress witness
            {identifier:2, bWitness:false, value_type:WOWOK.ValueType.TYPE_ADDRESS, value:machine_id} // machine
        ], 
        root: {logic:WOWOK.OperatorType.TYPE_LOGIC_AND, parameters:[ // progress'machine equals this machine
            {logic:WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters:[
                {query:800, object:{identifier:1}, parameters:[]}, // progress.machine
                {identifier:2}
            ]},
            {logic:WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters:[ // current node == order_completed
                {query:801, object:{identifier:1}, parameters:[]}, // 'Current Node'
                {value_type:WOWOK.ValueType.TYPE_STRING, value:INSURANCE_MACHINE_NODE.Insurance_Payment}
            ]}
        ]}
    };

    const guard_id = await result('Guard', await call_guard({data:data1})) as string;
    if (!guard_id) WOWOK.ERROR(WOWOK.Errors.Fail, 'guard_service_withdraw');

    const data2 : CallService_Data = { object:service_id,
        withdraw_guard:{op:'add', guards:[{guard:guard_id!, rate:10000},]}, bPublished:true
    }
    await result('Service', await call_service({data:data2}))
}

const guard_accident_recorded = async (machine_id:string, permission_id:string, repository_id:string) => {
    const data : CallGuard_Data = {namedNew:{},
        description:'Record incident report',
        table:[{identifier:1, bWitness:true, value_type:WOWOK.ValueType.TYPE_ADDRESS}, // progress witness
        ], 
        root: {logic:WOWOK.OperatorType.TYPE_LOGIC_AND, parameters:[ 
            {query:110, object:repository_id, parameters:[ // repository contains report for the progress?
                {identifier:1},// progress id
                {value:'report', value_type:WOWOK.ValueType.TYPE_STRING} 
            ]},
            {logic:WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters:[
                {query:800, object:{identifier:1}, parameters:[]}, // progress.machine
                {value:machine_id, value_type:WOWOK.ValueType.TYPE_ADDRESS} // machine id
            ]},
        ]}
    };
    const guard_id = await result('Guard', await call_guard({data:data})) as string;
    if (!guard_id) WOWOK.ERROR(WOWOK.Errors.Fail, 'guard_accident_recorded');

    const data2 : CallMachine_Data = { object:machine_id,
        nodes:{op:'add forward', data:[{prior_node_name:WOWOK.Machine.INITIAL_NODE_NAME, node_name:INSURANCE_MACHINE_NODE.Report_Incident,
            forward:{name:'Record incident report', weight: 1, permission:BUSINESS.adjuster, guard:guard_id}
        }]}
    }
    await result('Machine', await call_machine({data:data2})) // add new forward to machine
}

const guard_amount_claim = async (machine_id:string, permission_id:string, repository_id:string) => {
    const data : CallGuard_Data = {namedNew:{},
        description:'Record incident report',
        table:[{identifier:1, bWitness:true, value_type:WOWOK.ValueType.TYPE_ADDRESS}, // progress witness
        ], 
        root: {logic:WOWOK.OperatorType.TYPE_LOGIC_AND, parameters:[ 
            {query:110, object:repository_id, parameters:[ // repository contains amount for the progress?
                {identifier:1},// progress id
                {value:'amount', value_type:WOWOK.ValueType.TYPE_STRING} 
            ]},
            {logic:WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters:[
                {query:800, object:{identifier:1}, parameters:[]}, // progress.machine
                {value:machine_id, value_type:WOWOK.ValueType.TYPE_ADDRESS} // machine id
            ]},
        ]}
    };
    const guard_id = await result('Guard', await call_guard({data:data})) as string;
    if (!guard_id) WOWOK.ERROR(WOWOK.Errors.Fail, 'guard_amount_claim');

    const data2 : CallMachine_Data = { object:machine_id,
        nodes:{op:'add forward', data:[{prior_node_name:INSURANCE_MACHINE_NODE.Emergency_Treatment, node_name:INSURANCE_MACHINE_NODE.Amount_claim,
            forward:{name:'The claim cost is determined', weight: 1, permission:BUSINESS.adjuster, guard:guard_id}
        }]}
    }
    await result('Machine', await call_machine({data:data2})) // add new forward to machine
}

const guard_insurance_payment = async (machine_id:string, permission_id:string, repository_id:string) => {
    const data : CallGuard_Data = {namedNew:{},
        description:'Claim insurance payment',
        table:[{identifier:1, bWitness:true, value_type:WOWOK.ValueType.TYPE_ADDRESS}, // order witness
            {identifier:2, bWitness:true, value_type:WOWOK.ValueType.TYPE_ADDRESS}, // payment witness
        ], 
        root: {logic:WOWOK.OperatorType.TYPE_LOGIC_AND, parameters:[ // order'machine equals this machine
            {logic:WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters:[ // machine id matchs
                {identifier:1, witness:ContextType.TYPE_ORDER_MACHINE}, // order.machine
                {value_type:WOWOK.ValueType.TYPE_ADDRESS, value:machine_id}
            ]},
            {logic:WOWOK.OperatorType.TYPE_LOGIC_AS_U256_GREATER_EQUAL, parameters:[ // had payed 1000000 at least to order payer, for this progress session
                {query:1215, object: {identifier:2}, parameters:[ // payed amount
                    {context:WOWOK.ContextType.TYPE_GUARD}, // this guard verifying
                    {identifier:1}, //  payment.Object for Perpose: this order
                    {query:812, object: {identifier:1, witness:ContextType.TYPE_ORDER_PROGRESS}, parameters:[]}, // progress.Current Session-id: progress.Current Session-id
                    {identifier:1} // payed for order object
                ]},
                {value_type:ValueType.TYPE_U64, value:1000000}
            ]},
            {logic:WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters:[ // payed token type
                {query:1217, object: {identifier:2}, parameters:[]}, // payment token type
                {query:516, object: {identifier:1}, parameters:[]}, // order token type
            ]},
        ]}
    };
    
    const guard_id = await result('Guard', await call_guard({data:data})) as string;
    if (!guard_id) WOWOK.ERROR(WOWOK.Errors.Fail, 'guard_insurance_payment');

    const data2 : CallMachine_Data = { object:machine_id,
        nodes:{op:'add forward', data:[{prior_node_name:INSURANCE_MACHINE_NODE.Amount_claim, node_name:INSURANCE_MACHINE_NODE.Insurance_Payment,
            forward:{name:'Claim insurance payment', weight: 1, permission:BUSINESS.finance, guard:guard_id}
        }]}
    }
    await result('Machine', await call_machine({data:data2})) // add new forward to machine
}

const permission = async () : Promise<string | undefined>=> {
    const biz : WOWOK.BizPermission[] = [];
    for (const key in BUSINESS) { // add business permissions first.
        if (isNaN(Number(key))) {
           biz.push({index:parseInt(BUSINESS[key]), name:key})
        }
    }
    const data : CallPermission_Data = { description: 'Outdoor accident insurance',  object:{name:'insurance permission'},
        biz_permission:{op:'add', data:biz},
        permission:{op:'add entity', entities:[
            {address: {name_or_address: TESTOR[0].address}, permissions: [ {index:BUSINESS.adjuster}, ],},
            {address: {name_or_address: TESTOR[1].address}, permissions: [ {index:BUSINESS.adjuster}, ],},
            {address: {name_or_address: TESTOR[2].address}, permissions: [ {index:BUSINESS.finance}],},
        ]},
        admin:{op:'add', addresses:[{name_or_address:TEST_ADDR()}]}
    }
    const r = await call_permission({data:data});
    return await result('Permission', r) as string;
}

const machine = async (permission_id:string) : Promise<string | undefined>=> {
    const data : CallMachine_Data = { description: 'machine for an insurance',  object:{name:'machine', permission:permission_id},
        endpoint:'https://x4o43luhbc.feishu.cn/docx/IyA4dUXx1o6ilDxQMMKc3CoonGd?from=from_copylink',
        nodes:{op:'add', data:[Report_Incident, Emergency_Treatment, Amount_claim, Amount_claim, Insurance_Payment]}
    }
    const r = await call_machine({data:data}); 
    return await result('Machine', r) as string;
}

