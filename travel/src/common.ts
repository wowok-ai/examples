
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
        return "0xc9bbc30f72ef7d9aa674a3be1448b9267141a676b59f3f4315231617a5bbc0e8"
    }
}

export interface Testor {
    address: string;
    privkey: string;
}

export const TESTOR:Testor[] = [
    {address:'0xbdc19ffb6e69c418816aabd8cc56ab2328035bedc91506a0e59beace2d992b62', privkey:'0x0f18f2ecd323d8f0bc867c43e0d50dcad186bd01f352993b7ac4933489a996d'},
    {address:'0xeefc95ef5c5e8284edd64f2d5e1a8929b8652b41f8685365e689bb42981b1de9', privkey:'0x0738f2e986a586bf9212584d8abee63659bafdae7d6543da1339011e27cc5ea'},
    {address:'0xde3a2f6529fbb3a52efa9edda7b81d73f7ebd8890a54240ab5d5f71b620f594f', privkey:'0x0c9e061d4b82dfdf76b6829e874575b782bf7afebe1c32ecdab4bfd0d399'},
    {address:'0xb74463d6ab71f98e3637506030592eb23cf03ebef30ee6fc2446e4517e6535d3', privkey:'0x0d7d2b3b6895ee960ebcf26131343b8714162384f81b6bebb96dd93aaa73ff31'},
    {address:'0x4da05b53d2a1185f6bace167ac7b2c0b10e0390e1b0d7b2bc3846c54c5d962ec', privkey:'0x0b2a4f453c8fe466d647ace8f9b772c28fd47466eebbabedcaf6ae0f646bd6d'},
    {address:'0x7df2a91bb171fd297f073e2a7aed4665ddc894f710c1320aeeec8b7d7f1714ff', privkey:'0x02e4965aea3e419812df5314eec8e13d32c1fd2ffbfdee717696fdc186aec96c'},
    {address:'0xc05bd531bfbcf413db14eeea317548ed08b8d037a58694f2b6d0198f96c38248', privkey:'0x0ae294a5f49afd0d8efe171476e893cf1f4e0c7199b5a316eb61ab786b98a96'},
    {address:'0x6ac47d0e3999b4d87fb85ed6159d03f675db33cbc852cc5efda7f2f2f896e462', privkey:'0x067b0f72fa2e766b22736ca5979182305eebafe332e851ccdbeb6b9821933788'},
    {address:'0x3ff303d6cb70c500dab3b28feb7520bdab2b219ff4c7dab1622897febe880f48', privkey:'0x0eb2bacd198491a3b1e4d7cbd29adfaff54fc27c82749c81de67ab51c419fb4'},
    {address:'0x61cf31ff835cd88122be3dae246ebe506d0a1c8693ef70c38867f45357031ee4', privkey:'0x068538ad59e29f0f637cc2196b686c322217ce4cf33b12fa4a932dc5312ca037'},
];

export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export const PROTOCOL = new WOWOK.Protocol(WOWOK.ENTRYPOINT.testnet);
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
        const i = r.find(v => v.type === type)?.object;
        if (i) {
            console.log(type + ': ' + i);     
            await sleep(2000);
        }
        return i;
    } else if (res) {
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
    permission: string;
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
    var acc = await LocalMark.Instance().get_account(name, true);
    if (!acc) {
        console.log('Account not found, please check the account name: ' + name);
        return;
    }
    await Account.Instance().faucet(acc);
    await sleep(1000);
}

