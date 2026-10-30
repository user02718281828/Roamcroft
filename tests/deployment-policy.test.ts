import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {applyWorkerAddressPolicy} from '../scripts/worker-address-policy.mjs';

test('custom-domain policy disables both Worker endpoints, including named environments, preserving bindings and routes',()=>{
  const policy=JSON.parse(readFileSync('deployment.config.json','utf8'));
  assert.equal(policy.workers_dev,false);assert.equal(policy.preview_urls,false);
  const config={name:'roamcroft',workers_dev:true,preview_urls:true,
    routes:[{pattern:'roamcroft.com',custom_domain:true}],
    d1_databases:[{binding:'DB',database_id:'unchanged'}],
    durable_objects:{bindings:[{name:'ROOMS',class_name:'RealtimeRoom'}]},
    migrations:[{tag:'realtime-v1',new_sqlite_classes:['RealtimeRoom']}],
    env:{preview:{name:'roamcroft-preview',workers_dev:true,preview_urls:true},production:{name:'roamcroft'}}};
  const before=structuredClone(config);
  applyWorkerAddressPolicy(config,policy);
  assert.deepEqual(config,{...before,workers_dev:false,preview_urls:false,env:{
    preview:{...before.env.preview,workers_dev:false,preview_urls:false},
    production:{...before.env.production,workers_dev:false,preview_urls:false}}});
  const dashboardDomains={name:'roamcroft'};
  applyWorkerAddressPolicy(dashboardDomains,policy);
  assert.equal('routes' in dashboardDomains,false,'do not take over Dashboard-managed custom domains');
});

test('a missing or enabled endpoint policy fails before mutating generated config',()=>{
  for(const policy of [{},{workers_dev:false},{workers_dev:true,preview_urls:false},{workers_dev:false,preview_urls:true}]){
    const config={name:'roamcroft'};
    assert.throws(()=>applyWorkerAddressPolicy(config,policy),/custom domain/);
    assert.deepEqual(config,{name:'roamcroft'});
  }
});
