# hc-pool-test-node
Hana Cloud Connection Pool Test - Multitenant(HDI) -  Nodejs

Compare standard connection pooling logic, with custom logic to reuse/share pooled connections between technical users.

Using @Hana-client 




cf api <SAP BTP CF API ENDPOINT>
cf login




cf push


# TEST 14 Concurrent loads

## NO POOLING 

for i in {1..7}; do curl "https://{APP ROUTE}/asyncTestStd?tenant=1&noPooling=x" & curl "https://{APP ROUTE}/asyncTestStd?tenant=2&noPooling=x" & done

## POOLING 

for i in {1..7}; do curl "https://{APP ROUTE}/asyncTestStd?tenant=1" & curl "https://{APP ROUTE}/asyncTestStd?tenant=2" & done

## POOLING  SHARED ACROSS HDI Tenants
for i in {1..7}; do curl "https://{APP ROUTE}/asyncTest?tenant=1" & curl "https://{APP ROUTE}/asyncTest?tenant=2" & done








