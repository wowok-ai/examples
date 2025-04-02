
import { sleep, PAY_TYPE, PUBKEY, result, check_account, BUYER_ACCOUNT, ServiceReturn, GUARDS,  } from './common'
import { insurance } from './service_insurance';
import { Weather, weather } from './weather';
import { travel, TRAVEL_MACHINE_NODE } from './service_travel';
import { run_service } from './run'
import { Account, call_guard, CallGuard_Data, GuardNode, queryTableItem_ArbVote, tableItemQuery_RepositoryData, WOWOK } from 'wowok_agent';

const service = async () : Promise<{insurance_service:ServiceReturn, travel_service: ServiceReturn}> => {
    // service
    const service_insurance = await insurance();
    const repository_weather = await weather();
    const service = await travel(repository_weather, [service_insurance.service]);
    
    console.log('build services success')
    return {insurance_service:service_insurance, travel_service:service}
}



const main = async () => {
    await check_account();
    await check_account(BUYER_ACCOUNT);

    //await run_service_progress();
    //await run_progress()
}  

const run_service_progress = async () => {
    const res = await service();
    console.log('build services success');
    console.log(GUARDS);
    console.log(res.insurance_service);
    console.log(res.travel_service);
    
    // Start simulating the main processes for the roles across the service 
    await run_service(res.insurance_service, res.travel_service);
}

const run_progress = async () => {
    GUARDS.set('ice_scooting', '0xbf8d75ed665ad80b5f13767e682fe66034b7b6c8830cd0c8a7f2f244dd190928');
    GUARDS.set('cancel_ice_scooting', '0xaf9a13536e2af85bbd8f2fda1f6aa82fded615713d9f48ec98d6c3f3e372807f');
    GUARDS.set('complete_ice_scooting', '0x74e609707ab49588add5694b76bbfd3599a28725e45b8e42f0f3074146e67a00');
    const insurance_service: ServiceReturn = {service:'0x04ed97da8f4ff7b4ac11c5ee9c50fe4aae2f028351285e81bde1248b78595878', machine:'0x6ca07015faa0fa452b328bfdc7cdeb0831d8cbaf3bd1369381c595cc0328705f', permission:'0x779446a937d86b99a45eb756dd0015d621fab0f75e346e71b610d25812068d60'}
    const travel_service: ServiceReturn = {service:'0xdc68b7b592e500ea8ede36b642800366e5103c07c1bb5b53884ed9fd9e4a08f5', machine:'0xa3875a5306e9a06e86554a5ae1e6c9aa0c0571442f064ec5fbf6459d2f60e068', permission:'0x327bec4f347c41e404beb53a0f11d9b851c2d28d49ae2c0574f23a69a69b7e58'}
    await run_service(insurance_service, travel_service);
}

main().catch(console.error)