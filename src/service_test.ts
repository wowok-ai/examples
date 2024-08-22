 //@ts-ignore 
import { Protocol, Service_Discount_Type, Service_Buy, Service_Sale, Service, MachineObject, PermissionObject,
    DicountDispatch, TxbObject} from 'wowok';
import { TEST_ADDR } from './common'


export const SERVICE_PAY_TYPE = Protocol.SUI_TOKEN_TYPE;

const service_sales1:Service_Sale = {
    item:'cup A',
    price: 3,
    stock: 10,
}
const service_sales2:Service_Sale = {
    item:'cup B',
    price: 13,
    stock: 220,
}
const service_buy1: Service_Buy = {
    item: service_sales1.item,
    max_price: 3,
    count: 200,
}
const service_buy2: Service_Buy = {
    item: service_sales2.item,
    max_price: 13,
    count: 1,
}
const discount1 : DicountDispatch = {
    receiver: TEST_ADDR(),
    count: 10,
    discount:{
        name:'discounts for cup service ',
        price_greater: 100,
        type:Service_Discount_Type.ratio,
        off: 20,
        duration_minutes: 1000000,
    }
}
const discount2 : DicountDispatch = {
    receiver: TEST_ADDR(),
    count: 1,
    discount:{
        name:'discount',
        type:Service_Discount_Type.minus,
        off: 100,
        duration_minutes: 1000000,
        time_start: 200000,
    }
}

export const test_service_launch = async(protocol:Protocol, param:any) => {
    let permission = param.get('permission::Permission')[0] ;
    let machine = param.get('machine::Machine')[0] ;
    if (!permission || !machine) {
        console.log('test_service_launch param error')
        return ;
    }

    let service = Service.New(protocol.CurrentSession(), SERVICE_PAY_TYPE, permission, 'cup service', TEST_ADDR(), 'https://wwk.io/') ;
    service.set_machine(machine);
    service.add_sales([service_sales1, service_sales2]);
    service.add_stock(service_sales1.item, 10000); // increase stock
    service.set_price(service_sales2.item, 8); // reduce price
    service.discount_transfer([discount1, discount2]);
    service.publish(); 
    service.launch();
}

export const test_service_order = async(protocol:Protocol, param:any) => {
    let permission = param.get('permission::Permission')[0] 
    let machine = param.get('machine::Machine')[0] ;
    let s = param.get('service::Service')[0];

    let service = Service.From(protocol.CurrentSession(), SERVICE_PAY_TYPE, permission, s);
    let txb = protocol.CurrentSession();
    txb.setGasBudget(10000000); // must be enough coin
    //service.buy([service_buy1, service_buy2], txb.splitCoins(txb.gas, [txb.pure(100000)]), param.get('order::Discount')[0] as string, machine);
    service.buy([service_buy1, service_buy2], txb.splitCoins(txb.gas, [txb.pure.u64(10000)]), /*param.get('order::Discount')[1], machine */);
    //service.buy([service_buy2], txb.splitCoins(txb.gas, [txb.pure(100000)]), param.get('order::Discount')[2] as string, machine);
}

export const test_service_withdraw = async(protocol:Protocol, param:any) => {
    console.log(param)
    let permission = param.get('permission::Permission')[0] ;
    let s = param.get('service::Service')[0] ;
    let orders = param.get('order::Order') as TxbObject[];
    let service = Service.From(protocol.CurrentSession(), SERVICE_PAY_TYPE, permission, s);

    orders.forEach((o) => {
        service.withdraw(o);
    })
}