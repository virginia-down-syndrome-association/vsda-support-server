

/*
  * This function uses admin credentials to compile user metrics using the ArcGIS REST API. 
*/
export const grabPlatformMetrics = async (req, res) => {
  const groupId = ''
  const url = `https://www.arcgis.com/sharing/rest/community/groups/${groupId}/users`


  return {
    groupCount: 0,
    userCount: 0,
    webMapCount: 0,
    webApplicationCount: 0,
  }

}


