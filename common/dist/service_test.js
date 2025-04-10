//@ts-ignore 
import { Protocol, Service_Discount_Type, Service, Treasury, Arbitration } from 'wowok';
import { TEST_ADDR } from './common.js';
export const SERVICE_PAY_TYPE = Protocol.SUI_TOKEN_TYPE;
const service_sales1 = {
    item: 'cup A',
    price: '3',
    stock: '10111',
};
const service_sales2 = {
    item: 'cup B',
    price: '12',
    stock: '22',
};
const service_buy1 = {
    item: service_sales1.item,
    max_price: '3',
    count: '22',
};
const service_buy2 = {
    item: service_sales2.item,
    max_price: '13',
    count: '1',
};
const discount1 = {
    receiver: TEST_ADDR(),
    count: 6,
    discount: {
        name: 'discounts for cup service ',
        price_greater: BigInt(100),
        type: Service_Discount_Type.ratio,
        off: 20,
        duration_minutes: 1000000,
    }
};
const discount2 = {
    receiver: TEST_ADDR(),
    count: 11,
    discount: {
        name: 'discount',
        type: Service_Discount_Type.minus,
        off: 100,
        duration_minutes: 1000000,
        time_start: 200000,
    }
};
export const test_service_launch = async (protocol, param) => {
    let permission = param.get('permission::Permission')[0];
    let machine = param.get('machine::Machine')[0];
    let guard = param.get('guard::Guard')[0];
    if (!permission || !machine) {
        console.log('test_service_launch param error');
        return;
    }
    const t = Treasury.New(protocol.sessionCurrent(), SERVICE_PAY_TYPE, permission, 'Order revenue Treasury');
    const a = Arbitration.New(protocol.sessionCurrent(), SERVICE_PAY_TYPE, permission, 'Test', BigInt(0), t.get_object());
    a.pause(false);
    let service = Service.New(protocol.sessionCurrent(), SERVICE_PAY_TYPE, permission, 'cup service', t.get_object());
    service.set_machine(machine);
    service.add_sales([service_sales1, service_sales2]);
    service.add_stock(service_sales1.item, BigInt(10000)); // increase stock
    service.set_price(service_sales2.item, BigInt(8)); // reduce price
    service.discount_transfer([discount1, discount2]);
    service.add_withdraw_guards([{ guard: guard, percent: 100 }]);
    service.add_arbitration(a.get_object(), SERVICE_PAY_TYPE);
    service.publish();
    service.launch();
    a.launch();
    t.launch();
};
export const test_service_order = async (protocol, param) => {
    let permission = param.get('permission::Permission')[0];
    let machine = param.get('machine::Machine')[0];
    let s = param.get('service::Service')[0];
    let service = Service.From(protocol.sessionCurrent(), SERVICE_PAY_TYPE, permission, s);
    let txb = protocol.sessionCurrent();
    txb.setGasBudget(10000000); // must be enough coin
    //service.buy([service_buy1, service_buy2], txb.splitCoins(txb.gas, [txb.pure(100000)]), param.get('order::Discount')[0] as string, machine);
    service.buy([service_buy1, service_buy2], txb.splitCoins(txb.gas, [txb.pure.u64(10000)]));
    //service.buy([service_buy2], txb.splitCoins(txb.gas, [txb.pure(100000)]), param.get('order::Discount')[2] as string, machine);
};
export const test_service_withdraw = async (protocol, param) => {
    console.log(param);
    /*   let permission = param.get('permission::Permission')[0] ;
        let s = param.get('service::Service')[0] ;
        let orders = param.get('order::Order') as TxbObject[];
        let service = Service.From(protocol.sessionCurrent(), SERVICE_PAY_TYPE, permission, s);
    
        orders.forEach((o) => {
            service.withdraw(o, );
        }) */
};
