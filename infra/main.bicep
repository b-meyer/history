targetScope = 'subscription'

@description('Azure region.')
param location string = 'centralus'

@description('Resource group name.')
param resourceGroupName string = 'rg-history-prod'

resource rg 'Microsoft.Resources/resourceGroups@2021-04-01' = {
  name: resourceGroupName
  location: location
}

module site 'swa.bicep' = {
  name: 'swa-history'
  scope: rg
  params: {
    appName: 'history'
    location: location
  }
}

output resourceGroupName string = rg.name
output staticWebAppName string = site.outputs.resourceName
