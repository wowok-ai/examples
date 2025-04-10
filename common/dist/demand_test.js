import { Demand, Protocol } from 'wowok';
import { SERVICE_PAY_TYPE } from './service_test.js';
export const test_demand_launch = async (protocol, param) => {
    let permission_id = param.get('permission::Permission')[0];
    let txb = protocol.sessionCurrent();
    let d = Demand.New(txb, Protocol.SUI_COIN_TYPE, true, 10000000000, permission_id, 'demand TEST');
    d.deposit(txb.splitCoins(txb.gas, [200000]));
    d.deposit(txb.splitCoins(txb.gas, [200000]));
    d.deposit(txb.splitCoins(txb.gas, [200000]));
    d.deposit(txb.splitCoins(txb.gas, [200000]));
    d.deposit(txb.splitCoins(txb.gas, [200000]));
    d.expand_time(true, 2000000000);
    d.launch();
};
export const test_demand_yes = async (protocol, param) => {
    let perm = param.get('permission::Permission')[0];
    let s1 = param.get('service::Service')[0];
    let s2 = param.get('service::Service')[1];
    if (!s1 || !s2 || !perm) {
        return;
    }
    // demand earnest_type must equal that demand created by
    let d = Demand.From(protocol.sessionCurrent(), Protocol.SUI_COIN_TYPE, perm, param.get('demand::Demand')[0]);
    d.present(s1, SERVICE_PAY_TYPE, 'hello, service here');
    d.present(s1, SERVICE_PAY_TYPE, 'hello, service here and we had already service more than 200 teams'); // change tips 
    d.present(s2, SERVICE_PAY_TYPE, 'SERVICE 2');
    d.set_description('i wanna time time time...');
    d.yes(s2);
};
