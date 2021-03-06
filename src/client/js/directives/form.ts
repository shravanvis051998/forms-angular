/// <reference path="../../index.d.ts" />

module fng.directives {

  enum tabsSetupState {Y, N, Forced}

  /*@ngInject*/
  export function formInput($compile, $rootScope, $filter, $timeout, cssFrameworkService, formGenerator, formMarkupHelper):angular.IDirective {
    return {
      restrict: 'EA',
      link: function (scope:fng.IFormScope, element, attrs:fng.IFormAttrs) {
//                generate markup for bootstrap forms
//
//                Bootstrap 3
//                Horizontal (default)
//                <div class="form-group">
//                    <label for="inputEmail3" class="col-sm-2 control-label">Email</label>
//                    <div class="col-sm-10">
//                        <input type="email" class="form-control" id="inputEmail3" placeholder="Email">
//                    </div>
//                 </div>
//
//                Vertical
//                <div class="form-group">
//                    <label for="exampleInputEmail1">Email address</label>
//                    <input type="email" class="form-control" id="exampleInputEmail1" placeholder="Enter email">
//                </div>
//
//                Inline or stacked
//                <div class="form-group">
//                    <label class="sr-only" for="exampleInputEmail2">Email address</label>
//                    <input type="email" class="form-control" id="exampleInputEmail2" placeholder="Enter email">
//                </div>

//                Bootstrap 2
//                Horizontal (default)
//                <div class="control-group">
//                    <label class="control-label" for="inputEmail">Email</label>
//                    <div class="controls">
//                        <input type="text" id="inputEmail" placeholder="Email">
//                    </div>
//                </div>
//
//                Vertical
//                <label>Label name</label>
//                <input type="text" placeholder="Type something…">
//                <span class="help-block">Example block-level help text here.</span>
//
//                Inline or Stacked
//                <input type="text" class="input-small" placeholder="Email">

        var subkeys = [];
        var tabsSetup:tabsSetupState = tabsSetupState.N;

        var generateInput = function (fieldInfo, modelString, isRequired, idString, options) {

          function generateEnumInstructions() : IEnumInstruction{
            var enumInstruction:IEnumInstruction;
            if (angular.isArray(scope[fieldInfo.options])) {
              enumInstruction = {repeat: fieldInfo.options, value: 'option'};
            } else if (scope[fieldInfo.options] && angular.isArray(scope[fieldInfo.options].values)) {
              if (angular.isArray(scope[fieldInfo.options].labels)) {
                enumInstruction = {
                  repeat: fieldInfo.options + '.values',
                  value: fieldInfo.options + '.values[$index]',
                  label: fieldInfo.options + '.labels[$index]'
                };
              } else {
                enumInstruction = {
                  repeat: fieldInfo.options + '.values',
                  value: fieldInfo.options + '.values[$index]'
                };
              }
            } else {
              throw new Error('Invalid enumeration setup in field ' + fieldInfo.name);
            }
            return enumInstruction;
          }

          var nameString;
          if (!modelString) {
            var modelBase = (options.model || 'record') + '.';
            modelString = modelBase;
            if (options.subschema && fieldInfo.name.indexOf('.') !== -1) {
              // Schema handling - need to massage the ngModel and the id
              var compoundName = fieldInfo.name;
              var root = options.subschemaroot;
              var lastPart = compoundName.slice(root.length + 1);
              if (options.index) {
                modelString += root + '[' + options.index + '].' + lastPart;
                idString = 'f_' + modelString.slice(modelBase.length).replace(/(\.|\[|]\.)/g, '-');
              } else {
                modelString += root;
                if (options.subkey) {
                  idString = modelString.slice(modelBase.length).replace(/\./g, '-') + '-subkey' + options.subkeyno + '-' + lastPart;
                  modelString += '[' + '$_arrayOffset_' + root.replace(/\./g, '_') + '_' + options.subkeyno + '].' + lastPart;
                } else {
                  modelString += '[$index].' + lastPart;
                  idString = null;
                  nameString = compoundName.replace(/\./g, '-');
                }
              }
            } else {
              modelString += fieldInfo.name;
            }
          }

          var allInputsVars = formMarkupHelper.allInputsVars(scope, fieldInfo, options, modelString, idString, nameString);
          var common = allInputsVars.common;
          var value;
          isRequired = isRequired || fieldInfo.required;
          var requiredStr = isRequired ? ' required ' : '';
          var enumInstruction:IEnumInstruction;

          function handleReadOnlyDisabled(readonly: any): string {
            let retVal = '';
            if (readonly) {
              if (typeof readonly === "boolean") {
                retVal = ` disabled `;
              } else {
                retVal = ` ng-readonly="${readonly}" `;
              }
            }
            return retVal;
          }

          switch (fieldInfo.type) {
            case 'select' :
              if (fieldInfo.select2) {
                value = '<input placeholder="fng-select2 has been removed" readonly>';
              } else {
                common += handleReadOnlyDisabled(fieldInfo.readonly);
                common += fieldInfo.add ? (' ' + fieldInfo.add + ' ') : '';
                value = '<select ' + common + 'class="' + allInputsVars.formControl.trim() + allInputsVars.compactClass + allInputsVars.sizeClassBS2 + '" ' + requiredStr + '>';

                if (!isRequired) {
                  value += '<option></option>';
                }
                if (angular.isArray(fieldInfo.options)) {
                  angular.forEach(fieldInfo.options, function (optValue) {
                    if (_.isObject(optValue)) {
                      value += '<option value="' + ((<any>optValue).val || (<any>optValue).id) + '">' + ((<any>optValue).label || (<any>optValue).text) + '</option>';
                    } else {
                      value += '<option>' + optValue + '</option>';
                    }
                  });
                } else {
                  enumInstruction = generateEnumInstructions();
                  value += '<option ng-repeat="option in ' + enumInstruction.repeat + '"';
                  if (enumInstruction.label) {
                    value += ' value="{{' + enumInstruction.value + '}}"> {{ ' + enumInstruction.label + ' }} </option> ';
                  } else {
                    value += '>{{' + enumInstruction.value + '}}</option> ';
                  }
                }
                value += '</select>';
              }
              break;
            case 'link' :
              value = '<fng-link model="' + modelString + '" ref="' + fieldInfo.ref + '"';
              if (fieldInfo.form) {
                value += ' form="' + fieldInfo.form + '"';
              }
              if (fieldInfo.linktext) {
                value += ' text="' + fieldInfo.linktext + '"';
              }
              if (fieldInfo.readonly) {
                if (typeof fieldInfo.readonly === "boolean") {
                  value += ` readonly="true"`;
                } else {
                  value += ` ng-readonly="${fieldInfo.readonly}"`;
                }
              }
              value += '></fng-link>';
              break;
            case 'radio' :
              value = '';
              common += requiredStr;
              common += handleReadOnlyDisabled(fieldInfo.readonly);
              var separateLines = options.formstyle === 'vertical' || (options.formstyle !== 'inline' && !fieldInfo.inlineRadio);

              if (angular.isArray(fieldInfo.options)) {
                if (options.subschema) {
                  common = common.replace('name="', 'name="{{$index}}-');
                  common = common.replace('id="', 'id="{{$index}}-');
                }
                let thisCommon: string;
                angular.forEach(fieldInfo.options, function (optValue, idx) {
                  thisCommon = common.replace('id="', 'id="' + idx + '-');
                  value += '<input ' + thisCommon + 'type="radio"';
                  value += ' value="' + optValue + '">' + optValue;
                  if (separateLines) {
                    value += '<br />';
                  }
                });
              } else {
                var tagType = separateLines ? 'div' : 'span';
                if (options.subschema) {
                  common = common.replace('$index', '$parent.$index')
                    .replace('name="', 'name="{{$parent.$index}}-')
                    .replace('id="', 'id="{{$parent.$index}}-');
                }
                enumInstruction = generateEnumInstructions();
                value += '<' + tagType + ' ng-repeat="option in ' + enumInstruction.repeat + '">';
                value +=   '<input ' + common.replace('id="', 'id="{{$index}}-') + ' type="radio" value="{{' + enumInstruction.value + '}}"> {{';
                value += enumInstruction.label || enumInstruction.value;
                value += ' }} </' + tagType + '> ';
              }
              break;
            case 'checkbox' :
              common += requiredStr;
              common += handleReadOnlyDisabled(fieldInfo.readonly);
              if (cssFrameworkService.framework() === 'bs3') {
                value = '<div class="checkbox"><input ' + common + 'type="checkbox"></div>';
              } else {
                value = formMarkupHelper.generateSimpleInput(common, fieldInfo, options);
              }
              break;
            default:
              common += formMarkupHelper.addTextInputMarkup(allInputsVars, fieldInfo, requiredStr);
              if (fieldInfo.type === 'textarea') {
                if (fieldInfo.rows) {
                  if (fieldInfo.rows === 'auto') {
                    common += 'msd-elastic="\n" class="ng-animate" ';
                  } else {
                    common += 'rows = "' + fieldInfo.rows + '" ';
                  }
                }
                if (fieldInfo.editor === 'ckEditor') {
                  console.log('Deprecation Warning: "editor" property deprecated - use "add"');
                  common += 'ckeditor = "" ';
                  if (cssFrameworkService.framework() === 'bs3') {
                    allInputsVars.sizeClassBS3 = 'col-xs-12';
                  }
                }
                value = '<textarea ' + common + '></textarea>';
              } else {
                value = formMarkupHelper.generateSimpleInput(common, fieldInfo, options);
              }
          }
          return formMarkupHelper.inputChrome(value, fieldInfo, options, allInputsVars);
        };

        var convertFormStyleToClass = function (aFormStyle) {
          var result;
          switch (aFormStyle) {
            case 'horizontal' :
              result = 'form-horizontal';
              break;
            case 'vertical' :
              result = '';
              break;
            case 'inline' :
              result = 'form-inline';
              break;
            case 'stacked' :
              result = 'form-stacked';
              break;
            case 'horizontalCompact' :
              result = 'form-horizontal compact';
              break;
            default:
              result = 'form-horizontal compact';
              break;
          }
          return result;
        };

        var containerInstructions = function (info) {
          var result = {before: '', after: ''};
          if (typeof info.containerType === 'function') {
            result = info.containerType(info);
          } else {
            switch (info.containerType) {
              case 'tab' :
                var tabNo = -1;
                for (var i = 0; i < scope.tabs.length; i++) {
                  if (scope.tabs[i].title === info.title) {
                    tabNo = i;
                    break;
                  }
                }
                if (tabNo >= 0) {
// TODO Figure out tab history updates (check for other tab-history-todos)
                  // result.before = '<uib-tab deselect="tabDeselect($event, $selectedIndex)" select="updateQueryForTab(\'' + info.title + '\')" heading="' + info.title + '"'
                  result.before = '<uib-tab select="updateQueryForTab(\'' + info.title + '\')" heading="' + info.title + '"';
                  if (tabNo > 0) {
                    result.before += 'active="tabs[' + tabNo + '].active"';
                  }
                  result.before += '>';
                  result.after = '</uib-tab>';
                } else {
                  result.before = '<p>Error!  Tab ' + info.title + ' not found in tab list</p>';
                  result.after = '';
                }
                break;
              case 'tabset' :
                result.before = '<uib-tabset>';
                result.after = '</uib-tabset>';
                break;
              case 'well' :
                result.before = '<div class="well">';
                if (info.title) {
                  result.before += '<h4>' + info.title + '</h4>';
                }
                result.after = '</div>';
                break;
              case 'well-large' :
                result.before = '<div class="well well-lg well-large">';
                result.after = '</div>';
                break;
              case 'well-small' :
                result.before = '<div class="well well-sm well-small">';
                result.after = '</div>';
                break;
              case 'fieldset' :
                result.before = '<fieldset>';
                if (info.title) {
                  result.before += '<legend>' + info.title + '</legend>';
                }
                result.after = '</fieldset>';
                break;
              case undefined:
                break;
              case null:
                break;
              case '':
                break;
              default:
                result.before = '<div class="' + info.containerType + '">';
                if (info.title) {
                  var titleLook = info.titleTagOrClass || 'h4';
                  if (titleLook.match(/h[1-6]/)) {
                    result.before += '<' + titleLook + '>' + info.title + '</' + titleLook + '>';
                  } else {
                    result.before += '<p class="' + titleLook + '">' + info.title + '</p>';
                  }
                }
                result.after = '</div>';
                break;
            }
          }
          return result;
        };

        var handleField = function (info, options:fng.IFormOptions) {
          var fieldChrome = formMarkupHelper.fieldChrome(scope, info, options);
          var template = fieldChrome.template;

          if (info.schema) {
            var niceName = info.name.replace(/\./g, '_');
            var schemaDefName = '$_schema_' + niceName;
            scope[schemaDefName] = info.schema;
            if (info.schema) { // display as a control group
              //schemas (which means they are arrays in Mongoose)
              // Check for subkey - selecting out one or more of the array
              if (info.subkey) {
                info.subkey.path = info.name;
                scope[schemaDefName + '_subkey'] = info.subkey;

                var subKeyArray = angular.isArray(info.subkey) ? info.subkey : [info.subkey];
                for (var arraySel = 0; arraySel < subKeyArray.length; arraySel++) {
                  var topAndTail = containerInstructions(subKeyArray[arraySel]);
                  template += topAndTail.before;
                  template += processInstructions(info.schema, null, {
                    subschema: 'true',          // We are trying to behave like attrs here
                    formstyle: options.formstyle,
                    subkey: schemaDefName + '_subkey',
                    subkeyno: arraySel,
                    subschemaroot: info.name,
                    suppressNestingWarning: info.suppressNestingWarning
                  });
                  template += topAndTail.after;
                }
                subkeys.push(info);
              } else {
                if (options.subschema) {
                  if (!options.suppressNestingWarning) {
                    console.log('Attempts at supporting deep nesting have been removed - will hopefully be re-introduced at a later date');
                  }
                } else {
                  let model: string = (options.model || 'record') + '.' + info.name;
                  /* Array header */
                  if (typeof info.customHeader == 'string') {
                    template += info.customHeader;
                  } else {
                    let topButton: string = '';
                    if (info.unshift) {
                      topButton = '<button id="unshift_' + info.id + '_btn" class="add-btn btn btn-default btn-xs btn-mini form-btn" ng-click="unshift(\'' + info.name + '\',$event)">' +
                        '<i class="' + formMarkupHelper.glyphClass() + '-plus"></i> Add</button>';
                    }

                    if (cssFrameworkService.framework() === 'bs3') {
                      template += '<div class="row schema-head"><div class="col-sm-offset-3">' + info.label + topButton + '</div></div>';
                    } else {
                      template += '<div class="schema-head">' + info.label + topButton + '</div>';
                    }
                  }

                  /* Array body */
                  template += '<ol class="sub-doc"' + (info.sortable ? ` ui-sortable="sortableOptions" ng-model="${model}"` : '') + '>';

                  template += '<li ng-form class="' + (cssFrameworkService.framework() === 'bs2' ? 'row-fluid ' : '') +
                    convertFormStyleToClass(info.formStyle) + ' ' + (info.ngClass ? "ng-class:" + info.ngClass : "") + '" name="form_' + niceName + '{{$index}}" class="sub-doc well" id="' + info.id + 'List_{{$index}}" ' +
                    ' ng-repeat="subDoc in ' + model + ' track by $index">';
                  if (cssFrameworkService.framework() === 'bs2') {
                    template += '<div class="row-fluid sub-doc">';
                  }
                  if (info.noRemove !== true || info.customSubDoc) {
                    template += '   <div class="sub-doc-btns">';
                    if (typeof info.customSubDoc == 'string') {
                      template += info.customSubDoc;
                    }
                    if (info.noRemove !== true) {
                      template += `<button ${info.noRemove ? 'ng-hide="' + info.noRemove + '"' : ''} name="remove_${info.id}_btn" ng-click="remove('${info.name}', $index, $event)"`;
                      if (info.remove) {
                        template += ' class="remove-btn btn btn-mini btn-default btn-xs form-btn"><i class="' + formMarkupHelper.glyphClass() + '-minus"></i> Remove';
                      } else {
                        template += ' style="position: relative; z-index: 20;" type="button" class="close pull-right">';
                        if (cssFrameworkService.framework() === 'bs3') {
                          template += '<span aria-hidden="true">×</span><span class="sr-only">Close</span>';
                        } else {
                          template += '<span>×</span>';
                        }
                      }
                      template += '</button>';
                    }
                    template += '</div> ';
                  }

                  template += processInstructions(info.schema, false, {
                    subschema: 'true',
                    formstyle: info.formStyle,
                    model: options.model,
                    subschemaroot: info.name,
                    suppressNestingWarning: info.suppressNestingWarning
                  });

                  if (cssFrameworkService.framework() === 'bs2') {
                    template += '   </div>';
                  }
                  template += '</li>';

                  template += '</ol>';

                  /* Array footer */
                  if (info.noAdd !== true || typeof info.customFooter == 'string') {

                    let footer: string = '';
                    if (typeof info.customFooter == 'string') {
                      footer = info.customFooter;
                    }
                    let hideCond = '';
                    if (info.noAdd !== true) {
                      hideCond = info.noAdd ? 'ng-hide="' + info.noAdd + '"' : ''
                      footer += `<button ${hideCond} id="add_${info.id}_btn" class="add-btn btn btn-default btn-xs btn-mini" ng-click="add('${info.name}',$event)">
                                   <i class="' + formMarkupHelper.glyphClass() + '-plus"></i> 
                                   Add
                                 </button>`;
                    }
                    if (footer !== '') {
                      if (cssFrameworkService.framework() === 'bs3') {
                        template += `<div ${hideCond} class="row schema-foot"><div class="col-sm-offset-3">${footer}</div></div>`;
                      } else {
                        template += `<div ${hideCond} class = "schema-foot ">${footer}</div>`;
                      }
                    }
                  }
                }
              }
            }
          }
          else {
            // Handle arrays here
            var controlDivClasses = formMarkupHelper.controlDivClasses(options);
            if (info.array) {
              controlDivClasses.push('fng-array');
              if (options.formstyle === 'inline' || options.formstyle === 'stacked') {
                throw new Error('Cannot use arrays in an inline or stacked form');
              }
              template += formMarkupHelper.label(scope, info, info.type !== 'link', options);
              template += formMarkupHelper.handleArrayInputAndControlDiv(generateInput(info, info.type === 'link' ? null : 'arrayItem.x', true, info.id + '_{{$index}}', options), controlDivClasses, info, options);
            } else {
              // Single fields here
              template += formMarkupHelper.label(scope, info, null, options);
              if ((<any>options).required) {
                console.log("*********  Options required - found it ********");
              }
              template += formMarkupHelper.handleInputAndControlDiv(generateInput(info, null, (<any>options).required, info.id, options), controlDivClasses);
            }
          }
          template += fieldChrome.closeTag;
          return template;
        };

        const inferMissingProperties = function (info: IFormInstruction, options?: IBaseFormOptions) {
          // infer missing values
          info.type = info.type || 'text';
          if (info.id) {
            if (typeof info.id === 'number' || info.id.match(/^[0-9]/)) {
              info.id = '_' + info.id;
            }
          } else {
            if (options && options.noid) {
              info.id = null;
            } else {
              info.id = 'f_' + info.name.replace(/\./g, '_');
            }
          }
          info.label = (info.label !== undefined) ? (info.label === null ? '' : info.label) : $filter('titleCase')(info.name.split('.').slice(-1)[0]);
        };

//              var processInstructions = function (instructionsArray, topLevel, groupId) {
//  removing groupId as it was only used when called by containerType container, which is removed for now
        var processInstructions = function (instructionsArray, topLevel, options:fng.IFormOptions) {
          var result = '';
          if (instructionsArray) {
            for (var anInstruction = 0; anInstruction < instructionsArray.length; anInstruction++) {
              var info = instructionsArray[anInstruction];
              if (options.viewform) {
                info = angular.copy(info);
                info.readonly = true;
              }
              if (anInstruction === 0 && topLevel && !options.schema.match(/\$_schema_/) && typeof info.add !== 'object') {
                info.add = info.add ? ' ' + info.add + ' ' : '';
                if (info.add.indexOf('ui-date') === -1 && !options.noautofocus && !info.containerType) {
                  info.add = info.add + 'autofocus ';
                }
              }

              var callHandleField = true;
              if (info.directive) {
                var directiveName = info.directive;
                var newElement = '<' + directiveName + ' model="' + (options.model || 'record') + '"';
                var thisElement = element[0];
                inferMissingProperties(info, options);
                for (var i = 0; i < thisElement.attributes.length; i++) {
                  var thisAttr = thisElement.attributes[i];
                  switch (thisAttr.nodeName) {
                    case 'class' :
                      var classes = thisAttr.value.replace('ng-scope', '');
                      if (classes.length > 0) {
                        newElement += ' class="' + classes + '"';
                      }
                      break;
                    case 'schema' :
                      var bespokeSchemaDefName = ('bespoke_' + info.name).replace(/\./g, '_');
                      scope[bespokeSchemaDefName] = angular.copy(info);
                      delete scope[bespokeSchemaDefName].directive;
                      newElement += ' schema="' + bespokeSchemaDefName + '"';
                      break;
                    default :
                      newElement += ' ' + thisAttr.nodeName + '="' + thisAttr.value + '"';
                  }
                }
                newElement += ' ';
                var directiveCamel = $filter('camelCase')(info.directive);
                for (var prop in info) {
                  if (info.hasOwnProperty(prop)) {
                    switch (prop) {
                      case 'directive' :
                        break;
                      case 'schema' :
                        break;
                      case 'add' :
                        switch (typeof info.add) {
                          case 'string' :
                            newElement += ' ' + info.add;
                            break;
                          case 'object' :
                            for (var subAdd in info.add) {
                              if (info.add.hasOwnProperty(subAdd)) {
                                newElement += ' ' + subAdd + '="' + info.add[subAdd].toString().replace(/"/g, '&quot;') + '"';
                              }
                            }
                            break;
                          default:
                            throw new Error('Invalid add property of type ' + typeof(info.add) + ' in directive ' + info.name);
                        }
                        break;
                      case directiveCamel :
                        for (var subProp in info[prop]) {
                          if (info[prop].hasOwnProperty(subProp)) {
                            newElement += ` ${info.directive}-${subProp}="`;
                            if (typeof info[prop][subProp] === 'string') {
                              newElement += `${info[prop][subProp].replace(/"/g, '&quot;')}"`;
                            } else {
                              newElement += `${JSON.stringify(info[prop][subProp]).replace(/"/g, '&quot;')}"`;
                            }
                          }
                        }
                        break;
                      default:
                        if (info[prop]) {
                          if (typeof info[prop] === 'string') {
                            newElement += ' fng-fld-' + prop + '="' + info[prop].replace(/"/g, '&quot;') + '"';
                          } else {
                            newElement += ' fng-fld-' + prop + '="' + JSON.stringify(info[prop]).replace(/"/g, '&quot;') + '"';
                          }
                        }
                        break;
                    }
                  }
                }
                for (prop in options) {
                  if (options.hasOwnProperty(prop) && prop[0] !== '$' && typeof options[prop] !== 'undefined') {
                    newElement += ' fng-opt-' + prop + '="' + options[prop].toString().replace(/"/g, '&quot;') + '"';
                  }
                }

                newElement += 'ng-model="' + info.name + '"></' + directiveName + '>';
                result += newElement;
                callHandleField = false;
              } else if (info.containerType) {
                var parts = containerInstructions(info);
                switch (info.containerType) {
                  case 'tab' :
                    // maintain support for simplified tabset syntax for now
                    if (tabsSetup === tabsSetupState.N) {
                      tabsSetup = tabsSetupState.Forced;
                      result += '<uib-tabset active="activeTabNo">';
                      let activeTabNo: number = _.findIndex(scope.tabs, (tab) => (tab.active));
                      scope.activeTabNo = activeTabNo >= 0 ? activeTabNo : 0;
                    }

                    result += parts.before;
                    result += processInstructions(info.content, null, options);
                    result += parts.after;
                    break;
                  case 'tabset' :
                    tabsSetup = tabsSetupState.Y;
                    result += parts.before;
                    result += processInstructions(info.content, null, options);
                    result += parts.after;
                    break;
                  default:
                    // includes wells, fieldset
                    result += parts.before;
                    result += processInstructions(info.content, null, options);
                    result += parts.after;
                    break;
                }
                callHandleField = false;
              } else if (options.subkey) {
                // Don't display fields that form part of the subkey, as they should not be edited (because in these circumstances they form some kind of key)
                var objectToSearch = angular.isArray(scope[options.subkey]) ? scope[options.subkey][0].keyList : scope[options.subkey].keyList;
                if (_.find(objectToSearch, (value, key) => scope[options.subkey].path + '.' + key === info.name )) {
                  callHandleField = false;
                }
              }
              if (callHandleField) {
                //                            if (groupId) {
                //                                scope['showHide' + groupId] = true;
                //                            }
                inferMissingProperties(info, options);
                result += handleField(info, options);
              }
            }
          } else {
            console.log('Empty array passed to processInstructions');
            result = '';
          }
          return result;
        };

        var unwatch = scope.$watch(attrs.schema, function (newValue: any) {
          if (newValue) {
            var newArrayValue: Array<any> = angular.isArray(newValue) ? newValue : [newValue];   // otherwise some old tests stop working for no real reason
            if (newArrayValue.length > 0 && typeof unwatch === "function") {
              unwatch();
              unwatch = null;
              var elementHtml = '';
              var recordAttribute = attrs.model || 'record';      // By default data comes from scope.record
              var theRecord = scope[recordAttribute];
              theRecord = theRecord || {};
              if ((attrs.subschema || attrs.model) && !attrs.forceform) {
                elementHtml = '';
              } else {
                scope.topLevelFormName = attrs.name || 'myForm';     // Form name defaults to myForm
                // Copy attrs we don't process into form
                var customAttrs = '';
                for (var thisAttr in attrs) {
                  if (attrs.hasOwnProperty(thisAttr)) {
                    if (thisAttr[0] !== '$' && ['name', 'formstyle', 'schema', 'subschema', 'model', 'viewform'].indexOf(thisAttr) === -1) {
                      customAttrs += ' ' + attrs.$attr[thisAttr] + '="' + attrs[thisAttr] + '"';
                    }
                  }
                }
                let tag = attrs.forceform ? 'ng-form' : 'form';
                elementHtml = `<${tag} name="${scope.topLevelFormName}" class="${convertFormStyleToClass(attrs.formstyle)}" novalidate ${customAttrs}>`;
              }
              if (theRecord === scope.topLevelFormName) {
                throw new Error('Model and Name must be distinct - they are both ' + theRecord);
              }
              elementHtml += processInstructions(newArrayValue, true, attrs);
              if (tabsSetup === tabsSetupState.Forced) {
                elementHtml += '</uib-tabset>';
              }
              elementHtml += attrs.subschema ? '' : '</form>';
              //console.log(elementHtml);
              element.replaceWith($compile(elementHtml)(scope));
              // If there are subkeys we need to fix up ng-model references when record is read
              // If we have modelControllers we need to let them know when we have form + data
              let sharedData = scope[attrs.shared || 'sharedData'];
              let modelControllers = sharedData ? sharedData.modelControllers : [];
              if ((subkeys.length > 0 || modelControllers.length > 0)  && !scope.phaseWatcher){
                var unwatch2 = scope.$watch('phase', function (newValue) {
                  scope.phaseWatcher = true;
                  if (newValue === 'ready' && typeof unwatch2 === "function") {
                    unwatch2();
                    unwatch2 = null;

                    // Tell the 'model controllers' that the form and data are there
                    for (var i = 0; i < modelControllers.length; i++) {
                      if (modelControllers[i].onAllReady) {
                        modelControllers[i].onAllReady(scope);
                      }
                    }

                    // For each one of the subkeys sets in the form we need to fix up ng-model references
                    for (var subkeyCtr = 0; subkeyCtr < subkeys.length; subkeyCtr++) {
                      var info = subkeys[subkeyCtr];
                      var arrayOffset;
                      var matching;
                      var arrayToProcess = angular.isArray(info.subkey) ? info.subkey : [info.subkey];

                      var parts = info.name.split('.');
                      var dataVal = theRecord;
                      while (parts.length > 1) {
                        dataVal = dataVal[parts.shift()] || {};
                      }
                      dataVal = dataVal[parts[0]] = dataVal[parts[0]] || [];

                      // For each of the required subkeys of this type
                      for (var thisOffset = 0; thisOffset < arrayToProcess.length; thisOffset++) {

                        if (arrayToProcess[thisOffset].selectFunc) {
                          // Get the array offset from a function
                          if (!scope[arrayToProcess[thisOffset].selectFunc] || typeof scope[arrayToProcess[thisOffset].selectFunc] !== 'function') {
                            throw new Error('Subkey function ' + arrayToProcess[thisOffset].selectFunc + ' is not properly set up');
                          }
                          arrayOffset = scope[arrayToProcess[thisOffset].selectFunc](theRecord, info);

                        } else if (arrayToProcess[thisOffset].keyList) {
                          // We are choosing the array element by matching one or more keys
                          var thisSubkeyList = arrayToProcess[thisOffset].keyList;

                          for (arrayOffset = 0; arrayOffset < dataVal.length; arrayOffset++) {
                            matching = true;
                            for (var keyField in thisSubkeyList) {
                              if (thisSubkeyList.hasOwnProperty(keyField)) {
                                // Not (currently) concerned with objects here - just simple types and lookups
                                if (dataVal[arrayOffset][keyField] !== thisSubkeyList[keyField] &&
                                  (typeof dataVal[arrayOffset][keyField] === 'undefined' || !dataVal[arrayOffset][keyField].text || dataVal[arrayOffset][keyField].text !== thisSubkeyList[keyField])) {
                                  matching = false;
                                  break;
                                }
                              }
                            }
                            if (matching) {
                              break;
                            }
                          }
                          if (!matching) {
                            // There is no matching array element
                            switch (arrayToProcess[thisOffset].onNotFound) {
                              case 'error' :
                                var errorMessage = 'Cannot find matching ' + (arrayToProcess[thisOffset].title || arrayToProcess[thisOffset].path);
                                //Have to do this async as setPristine clears it
                                $timeout(function() {
                                  scope.showError(errorMessage, 'Unable to set up form correctly');
                                });
                                arrayOffset = -1;
                                //throw new Error(scope.errorMessage);
                                break;
                              case 'create':
                              default:
                                let nameElements = info.name.split('.');
                                let lastPart: string = nameElements.pop();
                                let possibleArray: string = nameElements.join('.');
                                let obj = theRecord;

                                // Should loop here when / if we re-introduce nesting
                                if (possibleArray) {
                                  obj = obj[possibleArray];
                                }
                                arrayOffset = obj[lastPart].push(thisSubkeyList) - 1;
                                break;
                            }
                          }
                        } else {
                          throw new Error('Invalid subkey setup for ' + info.name);
                        }
                        scope['$_arrayOffset_' + info.name.replace(/\./g, '_') + '_' + thisOffset] = arrayOffset;
                      }
                    }
                  }
                });
              }

              $rootScope.$broadcast('formInputDone', attrs.name);

              if (formGenerator.updateDataDependentDisplay && theRecord && Object.keys(theRecord).length > 0) {
                // If this is not a test force the data dependent updates to the DOM
                formGenerator.updateDataDependentDisplay(theRecord, null, true, scope);
              }
            }
          }

        }, true);

      }
    };
  }

}
