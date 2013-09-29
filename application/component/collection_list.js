function ComponentCollectionList(params) {
  var componentId          = 0,
      containerDOMElement  = {};

  if(typeof params.container_dom != "undefined")
    containerDOMElement = (typeof params.container_dom == "object" ? params.container_dom : false);

  if(typeof params.component_id != "undefined")
    componentId = params.component_id;

  containerDOMElement.innerHTML = 'Cake';
};