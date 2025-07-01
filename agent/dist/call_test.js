import { call_demand, call_guard, ResponseData, WOWOK, Account, call_permission, LocalMark } from 'wowok_agent';
import { sleep, TESTOR } from './common.js';
export const test_call = async () => {
    console.log(await LocalMark.Instance().list());
    console.log(await permission());
    await guard();
    //await demand()
};
var GUARD = '';
export const permission = async () => {
    const data = {
        data: {
            object: {
                name: "外卖",
                tags: [
                    "权限管理"
                ],
                useAddressIfNameExist: false,
                onChain: true
            },
            biz_permission: {
                op: "add",
                data: [
                    {
                        index: 1000,
                        name: "出餐权限"
                    },
                    {
                        index: 1001,
                        name: "送餐权限"
                    }
                ]
            },
            permission: {
                op: "add entity",
                entities: [
                    {
                        address: { name_or_address: TESTOR[3].address },
                        permissions: [
                            {
                                index: 1000
                            }
                        ]
                    },
                    {
                        address: { name_or_address: TESTOR[4].address },
                        permissions: [
                            {
                                index: 1000
                            }
                        ]
                    },
                    {
                        address: { name_or_address: TESTOR[5].address },
                        permissions: [
                            {
                                index: 1001
                            }
                        ]
                    }
                ]
            }
        }
    };
    return await call_permission(data);
};
export const guard = async () => {
    const data = { description: 'launch a guard', table: [
            { identifier: 1, bWitness: true, value_type: WOWOK.ValueType.TYPE_STRING }
        ], root: { logic: WOWOK.OperatorType.TYPE_LOGIC_EQUAL, parameters: [
                { value_type: WOWOK.ValueType.TYPE_STRING, value: 'aa' },
                { identifier: 1 }
            ] }
    };
    const r = await call_guard({ data: data });
    if (r?.digest) {
        const res = ResponseData(r);
        const g = res.find(v => v.change === 'created' && v.type === 'Guard');
        if (g) {
            GUARD = g.object;
        }
    }
};
export const faucet = async () => {
    await Account.Instance().faucet();
    console.log(await Account.Instance().list());
};
export const demand = async () => {
    const coin = await Account.Instance().coinObject_with_balance(1);
    await sleep(2000);
    if (coin) {
        const data = {
            object: { type_parameter: '0x2::coin::Coin<0x2::sui::SUI>' },
            guard: { guard: GUARD },
            description: 'this is some sdk test.',
            bounty: { op: 'add', object: { address: coin } }
        };
        const r = await call_demand({ data: data });
        if (r?.digest) {
            console.log(ResponseData(r));
        }
    }
};
