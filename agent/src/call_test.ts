import { call_object, CallBase, CallDemand_Data, CallGuard_Data, ResponseData, WOWOK } from 'wowok_agent'
import { sleep } from './common';
import { Account } from 'wowok_agent/src/account';

export const test_call = async () => {
    //await test_account()
    //await guard()
    await demand()
}

export const account = async () => {
    await Account.Instance().gen('bb', true); await sleep(2000)
    await Account.Instance().rename('bb', 'aa') ; await sleep(2000)
    await Account.Instance().gen('cc', true) ; await sleep(2000)
    await Account.Instance().rename('cc', 'aa', true) ;await sleep(2000)
    console.log(await Account.Instance().list())
    console.log(await Account.Instance().get_pair('aa'))
}

export const guard = async () => {
    const data : CallGuard_Data = {description:'launch a guard', table:[
        {identifier:1, bWitness:true, value_type:WOWOK.ValueType.TYPE_STRING}
    ], root: {logic:WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters:[
            {value_type:WOWOK.ValueType.TYPE_STRING, value:'aa'},
            {identifier:1}
        ]}
    }
    const r = await call_object({data:data, type:'Guard'})
    if ((r as any)?.digest) {
        console.log(ResponseData(r as WOWOK.CallResponse))
    }
}

export const faucet = async () => {
    await Account.Instance().faucet();
    console.log(await Account.Instance().list());
}

export const demand = async () => {
    const coin = await Account.Instance().coin_with_balance(1); await sleep(2000)
    if (coin) {
        const data: CallDemand_Data = {
            type_parameter:'0x2::coin::Coin<0x2::sui::SUI>', 
            guard:{address:'0x7333b947b1467dd43009077baa58154acf8fa8b139636ef0835cd17fdf057e84'},
            description:'this is some sdk test.',
            bounty:{op:'add', object:{address:coin}}
        }
        const r = await call_object({data:data, type:'Demand'})
        if ((r as any)?.digest) {
            console.log(ResponseData(r as WOWOK.CallResponse))
        }        
    }
}