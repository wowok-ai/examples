
import { Protocol, ENTRYPOINT, TxbObject, RpcResultParser,  Permission, Guard, OperatorType, Treasury, Treasury_WithdrawMode, 
    GuardMaker, MODULES, ContextType, ValueType,
    Treasury_Operation,
} from 'wowok';
import { TEST_PRIV, TEST_ADDR, TESTOR } from './common'


const main = async () => {
    let protocol = Protocol.Instance(ENTRYPOINT.suitest)
    let ids = new Map<string, TxbObject[]>();
    
    // permission
    RpcResultParser.objectids_from_response(protocol, await protocol.sign_excute([permission], TEST_PRIV(), ids), ids);
    console.log('permission id: ' + ids.get('permission::Permission'));  await sleep(2000)
   
    // treasury
    RpcResultParser.objectids_from_response(protocol, await protocol.sign_excute([treasury], TEST_PRIV(), ids), ids);
    console.log('treasury id: ' + ids.get('treasury::Treasury'));  await sleep(2000)
    
    // guard
    RpcResultParser.objectids_from_response(protocol, await protocol.sign_excute([day_guard], TEST_PRIV(), ids), ids); await sleep(2000); // guard 1
    RpcResultParser.objectids_from_response(protocol, await protocol.sign_excute([frequency_guard], TEST_PRIV(), ids), ids);  await sleep(2000); // guard 2
    RpcResultParser.objectids_from_response(protocol, await protocol.sign_excute([freshman_guard], TEST_PRIV(), ids), ids);  await sleep(2000); // guard 0

    console.log('guard id: ' + ids.get('guard::Guard'));  

    // add guards to treasury withraws
    RpcResultParser.objectids_from_response(protocol, await protocol.sign_excute([treasury_set], TEST_PRIV(), ids), ids);
    console.log(ids); 
}  

function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

const permission = async (protocol:Protocol, param:any) => {
    const p = Permission.New(protocol.sessionCurrent(), 'airdrop permission');
    p.launch();
}

const treasury = async (protocol:Protocol, param:any) => {
    const permission = param.get('permission::Permission')[0] ;
    const txb = protocol.sessionCurrent();
    const t = Treasury.New(txb, Protocol.SUI_TOKEN_TYPE, permission, '');

    t.deposit({coin:txb.splitCoins(txb.gas, [2000]), index:BigInt(1), remark:'airdrop coins'});
    t.launch()
}

const treasury_set = async (protocol:Protocol, param:any) => {
    const treasury = param.get('treasury::Treasury')[0] ;
    const permission = param.get('permission::Permission')[0] ;
    const guards = param.get('guard::Guard');
    const tr = Treasury.From(protocol.sessionCurrent(), Protocol.SUI_TOKEN_TYPE, permission, treasury);
    guards.forEach((v:string, index:number) => {
        tr.add_withdraw_guard(v, BigInt(100*(index+1)));
    });
    tr.set_withdraw_mode(Treasury_WithdrawMode.GUARD_ONLY_AND_IMMUTABLE);
    var desp = 'This airdrop treasury adds three withdrawal guards to define claiming operation criteria:\n';
    desp += 'Guard 1. Freshman who have never claimed can claim 300 at a time; \n';
    desp += 'Guard 2. Everyone can claim 100 for every more than 1 day; \n';
    desp += 'Guard 3. Everyone can claim 200 for every more than 1 day, if claimed already more than 10 times.'
    tr.set_description(desp);
}

const freshman_guard = async (protocol:Protocol, param:any) => {
    const treasury = param.get('treasury::Treasury')[0] ;
    const maker = new GuardMaker();
    maker.add_param(ContextType.TYPE_SIGNER)
        .add_param(ValueType.TYPE_U8, Treasury_Operation.WITHDRAW)
        .add_query(MODULES.treasury, 'Has Operation with Sgr', treasury)
        .add_logic(OperatorType.TYPE_LOGIC_NOT); // !withdraw ? for TEST_ADDR
    Guard.New(protocol.sessionCurrent(), 'Was it an address that never picked up this airdrop?', maker.build()).launch();
}

const day_guard = async (protocol:Protocol, param:any) => {
    const treasury = param.get('treasury::Treasury')[0] ;
    const maker = new GuardMaker();
    maker.add_param(ContextType.TYPE_SIGNER)
        .add_param(ValueType.TYPE_U8, Treasury_Operation.WITHDRAW)
        .add_query(MODULES.treasury, 'Recent Time with Op/Sgr', treasury) 
        .add_param(ValueType.TYPE_U64, 86400000) // 1 DAY
        .add_logic(OperatorType.TYPE_NUMBER_ADD, 2) // +
        .add_param(ContextType.TYPE_CLOCK) // current tx time
        .add_logic(OperatorType.TYPE_LOGIC_AS_U256_GREATER_EQUAL, 2); // current tx time >= (last withdraw time + 1 day)
    Guard.New(protocol.sessionCurrent(), 'Has the airdrop been claimed for more than 1 day?', maker.build()).launch()
}


const frequency_guard = async (protocol:Protocol, param:any) => {
    const treasury = param.get('treasury::Treasury')[0] ;
    const maker = new GuardMaker();
    const tr = maker.add_constant(ValueType.TYPE_ADDRESS, treasury);

    maker.add_param(ValueType.TYPE_U8, 10)
        .add_param(ContextType.TYPE_SIGNER)
        .add_param(ValueType.TYPE_U8, Treasury_Operation.WITHDRAW)
        .add_query(MODULES.treasury, 'Operation at Least Times by a Signer', tr) 

        .add_param(ContextType.TYPE_SIGNER)
        .add_param(ValueType.TYPE_U8, Treasury_Operation.WITHDRAW)
        .add_query(MODULES.treasury, 'Recent Time with Op/Sgr', tr) 
        .add_param(ValueType.TYPE_U64, 86400000) // 1 DAY
        .add_logic(OperatorType.TYPE_NUMBER_ADD, 2) // +
        .add_param(ContextType.TYPE_CLOCK) // current tx time
        .add_logic(OperatorType.TYPE_LOGIC_AS_U256_GREATER_EQUAL, 2) // current tx time >= (last withdraw time + 1 day)

        .add_logic(OperatorType.TYPE_LOGIC_AND, 2)
    Guard.New(protocol.sessionCurrent(), 'Has an address claimed 10 airdrops and has not claimed an airdrop for more than a day?', maker.build()).launch()
}


main().catch(console.error)