
import { sleep, PAY_TYPE, PUBKEY, result, check_account, BUYER_ACCOUNT, ServiceReturn, GUARDS,  } from './common'
import { insurance } from './service_insurance';
import { Weather, weather } from './weather';
import { travel, TRAVEL_MACHINE_NODE } from './service_travel';
import { run_service } from './run'
import { Account } from 'wowok_agent';

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
    console.log('Account list: ' + await Account.Instance().list());
    console.log('Default Account ' + ':' + await Account.Instance().default());

    await run_service_progress();
    //await run_progress_only()
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

const run_progress_only = async () => {
    GUARDS.set('ice_scooting', '0xf06c2eb446ec96b442a8889b65ec5fc18a84f5adc7207fda9f9ac55e73ffabea');
    GUARDS.set('cancel_ice_scooting', '0x01a01f6e10f7bd444a9f09181f19d298ad4ee2bcac32e0437cc768c6a81fb6eb');
    GUARDS.set('complete_ice_scooting', '0xea40855d27960a6af0dfb869730fd8a6cc8665eebae43ced2624907f7c1ebd3e');
    const insurance_service: ServiceReturn = {service:'0x6a30ad87fea3722e5a15985d86ea10684156b67df0824f52998d9b323f6b2f59', 
        machine:'0x8da4c77525448b3ac2468a672175e8f9a4c2108fa3a92790f8022a7178debd05', 
        permission:'0xd9774ea7d232bda7b9d2f94cc9de7d1337e270d40c72b6f13a34617336295669'}
    const travel_service: ServiceReturn = {service:'0xc534debf4a465240e58c400ac5645bddc2cdd13a91f145e16d7c32cb7cf4254c', 
        machine:'0x42fc96e487403f869d3f26d683051f25c14d93656f37b3d434fcaa50aea284bf', 
        permission:'0x61bca0ee95c6a99cf5a76638273036348350dd49a99e11f9e765f9cc541a17d2'}
    await run_service(insurance_service, travel_service);
}

main().catch(console.error)