
import { Account, call_service, CallResult, CallService_Data, GuardInfo_forCall, LocalMark, ResponseData, WOWOK } from 'wowok_agent'

export const TEST_ADDR = (): string => {  
    if (process.env.ADDR) {
        return process.env.ADDR as string 
    } else {
        return "0xe386bb9e01b3528b75f3751ad8a1e418b207ad979fea364087deef5250a73d3f"
    }
}

export const TEST_PRIV = (): string => {  
    if (process.env.PRIV) {
        return process.env.PRIV as string 
    } else {
        return "suiprivkey1qrymhsc0wthhmx4xwj3mu9zghyn8zsdxw66e706rz533v9a9h0qws2pmz66"
    }
}

export interface Testor {
    address: string;
    privkey: string;
}

export const TESTOR:Testor[] = [
    {
        address: '0xdde0847449b6ed54405053584779ab7c3a29257a5c1a88bb0b16588c67de401f',
        privkey: 'suiprivkey1qqdk8ggur2tzmddqe6nddc8msy94mhsxa5rtv9wdlew5zjk5ca5nkql0p6a'
    },
    {
        address: '0xa4ec7eb950179f1a051c8cd1fb03d4a0643688a2f4212010cc668fc356cc7066',
        privkey: 'suiprivkey1qzfjx4chrvpupu6p68nwqs4wst90872d85l859ulsmn2wca04agvkv0z4af'
    },
    {
        address: '0xf274de5e6a9b5ff0f55816be540d2f6f1b0c207c9f958431a32891313e28f3c6',
        privkey: 'suiprivkey1qz99tzqzat92eak92sture939uzjpvrjnw6lvh9prjwdvx7quvmyja9vjvw'
    },
    {
        address: '0xf7f03a75b8c7326de43808154d1f8b0a1a65aa8fbad56ca0c1119ccb1f256718',
        privkey: 'suiprivkey1qqxskkrdf3vdkzqqz96g3n9398lmda98lg5knxwxyuh6tsssyx5usz8z0v7'
    },
    {
        address: '0x06aab352bac7013d2c7fdeb3b05cc81579c78681a4d18c640957112c288d51ba',
        privkey: 'suiprivkey1qrfttf6udc7xuckpmx9qnhjhfluqzyqjlumzz67wgmkjg7k0edsdwkr0cj3'
    },
    {
        address: '0x4d1c0376ec5f384cc5ec4e60a1f13815d1f81c67ca49b4dcb8eaf85c6274887a',
        privkey: 'suiprivkey1qqxn0mcgyvxap366x7qygn0qhk9w92us4ayhzacm5czrm6rpwjvuzfuw4r7'
    },
    {
        address: '0xb1b7071f330fb98a5f5d650280dde55274cb2c516af479c92d643adae037a51f',
        privkey: 'suiprivkey1qqndq847xswpndmw7naq7aadzjl45h5c5355pqmqqpmu9dc435ynxd3vm5v'
    },
    {
        address: '0xbb0fbbb2b1df582b93e991af43b776a4c588d48cb055645c631151e013663264',
        privkey: 'suiprivkey1qp8s2n5l64uudwnus3m3jt738jyh3dyhxprdr7fhl9r8rmtzyd87uhdv59x'
    }
  ];
  
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export const PROTOCOL = WOWOK.Protocol.Instance(WOWOK.ENTRYPOINT.suitest);
export const PAY_TYPE = WOWOK.Protocol.SUI_TOKEN_TYPE; 
export const PUBKEY = '-----BEGIN PUBLIC KEY----- \
            MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCXFyjaaYXvu26BHM4nYQrPhnjL\
            7ZBQhHUyeLo+4GQ6NmjXM3TPH9O1qlRerQ0vihYxVy6u5QbhElsxDNHp6JtRNlFZ \
            qJE0Q/2KEaTTUU9PWtdt5yHY5Tsao0pgd2N4jiPWIx9wNiYJzcvztlbACU91NAif \
            e6QFRLNGdDVy3RMjOwIDAQAB \
            -----END PUBLIC KEY-----';

export const result = async(type:string, res:CallResult, account?:string, witness?:GuardInfo_forCall)  : Promise<string | undefined | GuardInfo_forCall> => {
    //console.log(res)
    if ((res as any)?.digest) {
        const r = ResponseData(res as WOWOK.CallResponse);
        let i = r.find(v => v.type === type)?.object;
        if (i) {
            console.log(type + ': ' + i);     
            await sleep(2000);
        } else {
            // fetch tx again.
            const n = await WOWOK.Protocol.Client().getTransactionBlock({digest:(res as any)?.digest, options:{showObjectChanges:true}})
            const r = ResponseData(n as WOWOK.CallResponse);
            i = r.find(v => v.type === type)?.object;
            if (i) {
                console.log(type + ': ' + i);     
                await sleep(2000);
            }
        }

        return i;
    } else  {
        console.log(res)
        return res as GuardInfo_forCall
    }
}

export interface LaunchOrderResult {
    order?: string;
    progress?: string;
}
export const launch_order = async(data:CallService_Data, account?:string, witness?:GuardInfo_forCall)  : Promise<LaunchOrderResult | undefined> => {
    const res = await call_service({data:data, account:account, witness:witness});
    if ((res as any)?.digest) {
        const r = ResponseData(res as WOWOK.CallResponse);
        if (r) {
            const i = r.find(v => v.type === 'Order')?.object;
            return {order:r.find(v => v.type === 'Order')?.object, progress:r.find(v => v.type === 'Progress')?.object}
        }
    } 
}

export const BUYER_ACCOUNT = 'buyer';
export const INSURANCE_PRODUCT:WOWOK.Service_Sale = {item:'Outdoor accident insurance', 
    price: '5', stock: '102', endpoint:'https://x4o43luhbc.feishu.cn/docx/IyA4dUXx1o6ilDxQMMKc3CoonGd?from=from_copylink'};
export const TRAVEL_PRODUCT:WOWOK.Service_Sale = {item:'Traveling Iceland', 
    price: '15', stock: '10', endpoint:'https://x4o43luhbc.feishu.cn/docx/IyA4dUXx1o6ilDxQMMKc3CoonGd?from=from_copylink'};

export interface ServiceReturn {
    machine: string;
    service: string;
}

export const GUARDS = new Map<string, string>();
export enum GUARDS_NAME {
    ice_scooting = 'ice_scooting',
    cancel_ice_scooting = 'cancel_ice_scooting',
    complete_ice_scooting = 'complete_ice_scooting'
}

export const check_account = async (name?:string) => {
    var acc = await Account.Instance().get(name);
    if (!acc) {
       acc = await Account.Instance().gen(name);
    }

    if (!acc) {
        console.log('Account not found, please check the account name: ' + name);
        return;
    }
    await Account.Instance().faucet(acc.address);
    await sleep(1000);
}

