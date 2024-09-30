import { TEST_ADDR } from './common'
import { MachineObject, ProgressObject, Machine_Node, Protocol, Machine, Progress, Guard, Permission, TxbObject} from 'wowok';

export const node_order_comfirmed:Machine_Node = {
    name: 'order confirmed',
    pairs: [
        {prior_node: Machine.INITIAL_NODE_NAME, threshold:10, forwards:[
            {name:'confirm order', weight: 5, permission:10000},
            {name:'confirm express', weight: 5, permission:10002},
        ]},
        {prior_node: 'order confirmed', threshold:10, forwards:[ // self-self
            {name:'confirm order', weight: 5, permission:10000},
            {name:'confirm express', weight: 5, permission:10002},
        ]}
    ]
}
export const node_order_delivered:Machine_Node = {
    name: 'order delivered',
    pairs: [
        {prior_node: node_order_comfirmed.name, threshold:0, forwards:[
            {name:'pick up dilivery - JD', namedOperator:'JD'},
            {name:'pick up dilivery - CN', namedOperator:'CN'},
            {name:'pick up dilivery - YT', namedOperator:'YT'},
        ]},
        {prior_node: Machine.INITIAL_NODE_NAME, threshold:0, forwards:[
            {name:'pick up dilivery - JD', namedOperator:'JD'},
            {name:'pick up dilivery - CN', namedOperator:'CN'},
            {name:'pick up dilivery - YT', namedOperator:'YT'},
        ]},
    ]
}
export const node_order_signed:Machine_Node = {
    name: 'order signed',
    pairs: [
        {prior_node: node_order_delivered.name, threshold:0, forwards:[
            {name:'payer signed', namedOperator: Machine.OPERATOR_ORDER_PAYER},
        ]},
    ]
}
export const node_order_canceled:Machine_Node = {
    name: 'order canceled',
    pairs: [
        {prior_node: Machine.INITIAL_NODE_NAME, threshold:0, forwards:[
            {name:'payed canceled',  namedOperator: Machine.OPERATOR_ORDER_PAYER},
            {name:'service canceled',  permission: 10000},
        ]},
        {prior_node: node_order_delivered.name, forwards:[
            {name:'payed canceled',  namedOperator: Machine.OPERATOR_ORDER_PAYER},
            {name:'express canceled', namedOperator:'EXPRESS'}
        ]},
        {prior_node: node_order_signed.name, forwards:[
            {name:'payed canceled',  namedOperator: Machine.OPERATOR_ORDER_PAYER},
            {name:'service canceled', permission: 10001}
        ]},
    ]
}

export const test_machine_launch = async (protocol:Protocol, param:any) => {
    let permission = param.get('permission::Permission')[0] ;
    let permission1 = param.get('permission::Permission')[1];    
    let repo = param.get('repository::Repository')? param.get('repository::Repository')[0] : undefined;

    let m = Machine.New(protocol.CurrentSession(), permission, 'mmmm....', 'https://best-service.com/');
    m.add_node([node_order_comfirmed, node_order_delivered, node_order_signed, node_order_canceled]);
    m.set_endpoint();
    m.set_endpoint('https://best-service.com/order-ops/');
    m.publish();

    if (repo) {
        m.add_repository(repo);
    }
    m.pause(true);
    m.launch();
}

export const node_order_delivered2:Machine_Node = {
    name: 'order delivered',
    pairs: [
        {prior_node: node_order_comfirmed.name, threshold:0, forwards:[
            {name:'pick up dilivery - JD', namedOperator:'JD'},
            {name:'pick up dilivery - CN', namedOperator:'CN'},
            {name:'pick up dilivery - YT', namedOperator:'YT'},
        ]},
        {prior_node: Machine.INITIAL_NODE_NAME, threshold:0, forwards:[
            {name:'pick up dilivery - JD', namedOperator:'JD'},
            {name:'pick up dilivery - CN', namedOperator:'CN'},
            {name:'pick up dilivery - YT', namedOperator:'YT'},
        ]},
    ]
}
export const node_order_canceled2:Machine_Node = {
    name: 'order canceled',
    pairs: [
        {prior_node: Machine.INITIAL_NODE_NAME, threshold:0, forwards:[
            {name:'payed canceled',  namedOperator: Machine.OPERATOR_ORDER_PAYER},
            {name:'service canceled',  permission: 10000},
        ]},
        {prior_node: node_order_delivered.name, forwards:[
            {name:'payed canceled',  namedOperator: Machine.OPERATOR_ORDER_PAYER},
            {name:'express canceled', namedOperator:'EXPRESS'}
        ]},
        {prior_node: node_order_signed.name, forwards:[
            {name:'payed canceled',  namedOperator: Machine.OPERATOR_ORDER_PAYER},
            {name:'service canceled', permission: 10001}
        ]},
    ]
}
// machine could edit nodes while NOT PUBULISHED
export const test_machine_edit_nodes = async (protocol:Protocol, param:any) => {
    let permission = param.get('permission::Permission')[0];
    let permission1 = param.get('permission::Permission')[1];
    let machine = Machine.From(protocol.CurrentSession(),  permission, param.get('machine::Machine')[0]);

    let new_machine = Machine.From(protocol.CurrentSession(), permission, machine.clone());
    new_machine.set_description('our new machine for test') 
    new_machine.change_permission(permission1);
    new_machine.remove_repository([], true); // must use permission2
    new_machine.remove_node(['order delivered', 'order canceled'])
    new_machine.add_node([node_order_canceled2, node_order_delivered2]) 
  //  new_machine.publish()
    new_machine.launch();
}

// machine could generate progresses while PUBLISHED
export const test_machine_progress = async (protocol:Protocol, param:any) => {
    let permission = param.get('permission::Permission')[0] as string; // permission 0
    let machine = Machine.From(protocol.CurrentSession(), permission, param.get('machine::Machine')[0]);
    machine.pause(false); // machine.bPaused=false & machine.bPublished=true, before creating progress for it
    let progress1 = Progress.New(protocol.CurrentSession(), machine.get_object() as TxbObject, permission, '0xb4a210d9f40dae7693f0362419aecd2125651f6dc2393e42ecf35f38578ac7d7');
    progress1.launch();
}

// machine could generate progresses while PUBLISHED
export const test_progress_run1 = async (protocol:Protocol, param:any) => {
    let permission = param.get('permission::Permission')[0]; // permission 0
    let machine = param.get('machine::Machine')[0];
    if (!permission || !machine) {
        console.log('test_progress_run1 param error');
        return 
    }
    let parent = Progress.From(protocol.CurrentSession(), machine, permission, param.get('progress::Progress')[0]);

    parent.set_namedOperator(Machine.OPERATOR_ORDER_PAYER, [TEST_ADDR()]);
    parent.hold({next_node_name:node_order_comfirmed.name, forward:'confirm order'}, true);
    parent.hold({next_node_name:node_order_comfirmed.name, forward:'confirm order'}, false);
    parent.hold({next_node_name:node_order_comfirmed.name, forward:'confirm order'}, true);
    parent.next({next_node_name:node_order_comfirmed.name, forward:'confirm order'}); // wight 5; threshold:10
    parent.hold({next_node_name:node_order_comfirmed.name, forward:'confirm express'}, true);

//    progress.next({next_node_name:node_order_canceled.name, forward:'payed canceled'});
}

// machine could generate progresses while PUBLISHED
export const test_progress_run2 = async (protocol:Protocol, param:any) => {
    let permission = param.get('permission::Permission')[0] as string; // permission 0
    let machine = param.get('machine::Machine')[0] as string;
    if (!permission || !machine) {
        console.log('test_progress_run2 param error');
        return 
    }
    let progress = Progress.From(protocol.CurrentSession(), machine, permission, param.get('progress::Progress')[0]);
    progress.next({next_node_name:node_order_canceled.name, forward:'payed canceled'}); // wight 5; threshold:10
    let child = Progress.From(protocol.CurrentSession(), machine, permission, param.get('progress::Progress')[1]);

    child.parent({parent_id:param.get('progress::Progress')[0],
        parent_session_id:0, next_node:node_order_canceled.name, forward:'payed canceled'
    })
}