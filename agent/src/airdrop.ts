
import { call_object, CallGuard_Data, CallTreasury_Data, ResponseData, WOWOK } from 'wowok_agent'
import { Account } from 'wowok_agent/src/account';

export const airdrop = async () => {
    console.log('current account: ' + Account.Instance().get_address());
   
    const TYPE = WOWOK.Protocol.SUI_TOKEN_TYPE;
    var res: any; 
    var treasury_id: string | undefined;
    var permission_id: string | undefined;
 
    // treasury
    var desp = 'This airdrop treasury adds three withdrawal guards to define claiming operation criteria:\n';
    desp += 'Guard 1. Freshman who have never claimed can claim 300 at a time; \n';
    desp += 'Guard 2. Everyone can claim 100 for every more than 1 day; \n';
    desp += 'Guard 3. Everyone can claim 200 for every more than 1 day, if claimed already more than 10 times.'
    const treasury : CallTreasury_Data = { description: desp,  object:{namedNew:{name:'airdrop treasury'}},
        type_parameter: TYPE, 
        permission:{namedNew:{name:'my permission', tags:['for treasury']}},
        deposit:{data:{balance:200}}
    }
    res = await call_object({type:'Treasury', data:treasury});
    if (res?.digest) {
        const r = ResponseData(res as WOWOK.CallResponse);
        if (r) {
            treasury_id = r.find(v => v.type === 'Treasury')?.object;
            permission_id = r.find(v => v.type === 'Permission')?.object;
            if (!treasury_id || !permission_id) {
                console.log('treasury or permission invalid');
                return
            }
        }
    } 
    
    console.log('treasury: ' + treasury_id);
    console.log('permission: ' + permission_id);
    
    const guards = await launch_guards(treasury_id!);
    if (!guards) {
        console.log('invalid guard ')
        return ;
    }
    console.log('guards: '+guards);

    const treasury_modify: CallTreasury_Data = {withdraw_guard:{op:'add', data:guards.map((v,i) => {return {guard:v, amount:1+i}})},
        type_parameter: TYPE, object:{address:treasury_id!}, permission:{address:permission_id!}, // reference of Treasury created.
        withdraw_mode:WOWOK.Treasury_WithdrawMode.GUARD_ONLY_AND_IMMUTABLE};
    res = await call_object({type:'Treasury', data:treasury_modify});        
    console.log(res)
}

const launch_guards = async (treasury_address:string) : Promise<string[] | undefined> => {
    const day_guard_data : CallGuard_Data = {namedNew:{name:'day guard'},
        description:'One airdrop can be picked up from the Treasury every 1 day.',
        table:[{identifier:1, bWitness:false, value_type:WOWOK.ValueType.TYPE_ADDRESS, value:treasury_address}],
        root: {logic:WOWOK.OperatorType.TYPE_LOGIC_AS_U256_GREATER_EQUAL, parameters:[
                {context:WOWOK.ContextType.TYPE_CLOCK},
                {calc:WOWOK.OperatorType.TYPE_NUMBER_ADD, parameters:[
                    {query:'Recent Time with Op/Sgr', object:1, parameters:[
                        {value_type:WOWOK.ValueType.TYPE_U8, value:WOWOK.Treasury_Operation.WITHDRAW},
                        {context:WOWOK.ContextType.TYPE_SIGNER}
                    ]},
                    {value_type:WOWOK.ValueType.TYPE_U64, value:86400000}
                ]}
            ]}
    }

    const freshman_guard_data : CallGuard_Data = {namedNew:{name:'freshman guard'},
        description:'An address that has never claimed an airdrop from the Treasury may claim an airdrop.',
        table:[{identifier:1, bWitness:false, value_type:WOWOK.ValueType.TYPE_ADDRESS, value:treasury_address}],
        root: {logic:WOWOK.OperatorType.TYPE_LOGIC_NOT, parameters:[
            {query:'Has Operation with Sgr', object:1, parameters:[
                {value_type:WOWOK.ValueType.TYPE_U8, value:WOWOK.Treasury_Operation.WITHDRAW},
                {context:WOWOK.ContextType.TYPE_SIGNER}
            ]},
        ]}
    }

    const frequency_guard_data : CallGuard_Data = {namedNew:{name:'frequency guard'},
    description:'One airdrop can be collected from the vault every 1 day, and has been collected more than 10 times in the past.',
    table:[{identifier:1, bWitness:false, value_type:WOWOK.ValueType.TYPE_ADDRESS, value:treasury_address}],
    root: {logic:WOWOK.OperatorType.TYPE_LOGIC_AND, parameters:[
            {query:'Operation at Least Times by a Signer', object:1, parameters:[
                {value_type:WOWOK.ValueType.TYPE_U8, value:WOWOK.Treasury_Operation.WITHDRAW},
                {context:WOWOK.ContextType.TYPE_SIGNER},
                {value_type:WOWOK.ValueType.TYPE_U8, value:10},
            ]}, 
            {logic:WOWOK.OperatorType.TYPE_LOGIC_AS_U256_GREATER_EQUAL, parameters:[
                {context:WOWOK.ContextType.TYPE_CLOCK},
                {calc:WOWOK.OperatorType.TYPE_NUMBER_ADD, parameters:[
                    {query:'Recent Time with Op/Sgr', object:1, parameters:[
                        {value_type:WOWOK.ValueType.TYPE_U8, value:WOWOK.Treasury_Operation.WITHDRAW},
                        {context:WOWOK.ContextType.TYPE_SIGNER}
                    ]},
                    {value_type:WOWOK.ValueType.TYPE_U64, value:86400000}
                ]}
            ]}
        ]}
    }

    const day_guard = await launch_guard(day_guard_data);
    const frequency_guard = await launch_guard(frequency_guard_data);
    const freshman_guard = await launch_guard(freshman_guard_data);
    //const res = await Promise.all([launch_guard(day_guard_data), launch_guard(frequency_guard_data), launch_guard(freshman_guard_data)]);
    if (day_guard && frequency_guard && freshman_guard) {
        return [day_guard, frequency_guard, freshman_guard]
    }
}

const launch_guard = async (data: CallGuard_Data) : Promise<string | undefined> => {
    const res = await call_object({type:"Guard", data:data});
    if ((res as any)?.digest) {
        return ResponseData(res as WOWOK.CallResponse)?.find(v => v.type === 'Guard')?.object;
    } 
}