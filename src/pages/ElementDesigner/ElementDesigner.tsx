import { ChangeEvent, useState } from 'react';
import './ElementDesigner.css';
import {
  Selector,
  backgroundProperties,
  borderStyles,
  cursorKeywords,
  selectors,
  Element,
  ConditionalValue,
  textAlignKeywords,
  displayKeywords,
  gridAutoFlowKeywords,
} from './ElementDesignerTypes';
import Input from '../../components/Input/Input'
import UnitSelect from '../../components/UnitSelect/UnitSelect';
import Select from "../../components/Select/Select";
import { MdContentCopy, MdAddCircle } from "react-icons/all";
import { deepCopy, generateId, generateUUID, toCamelCase } from '../../utilities';
import { Type, types } from '../../components/Input/InputTypes';
import TreeView from '../../components/TreeView/TreeView';
import ElementPreview from '../../components/ElementPreview.tsx/ElementPreview';
import { TreeNode } from '../../components/TreeView/TreeViewTypes';
import { defaultElement } from './ElementDesignerData';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { StyleEngine } from '../../helpers/style-engine';

function ElementDesigner() {
  const initialElement: Element = defaultElement;
  const [selectedElementId, setSelectedElementId] = useState(initialElement.uuid);
  const [tree, setTree] = useState<TreeNode[]>([
    {
      element: initialElement,
      onClick: () => setSelectedElementId(initialElement.uuid),
    }
  ]);

  /**
   * Get the conditions when a property should be applied, and what the styling should be
   * @param {Element} element Element to get its property conditions
   * @returns {ConditionalValue[]} conditions when a property should be applied, and what the styling should be
   */
  const getStylingConditions = (element: Element): ConditionalValue[] => {
    return [
      {
        property: 'display',
        value: element.properties.display.keyword,
        condition: element.properties.display.active,
      },
      {
        property: 'grid-auto-flow',
        value: element.properties.gridAutoFlow.keyword,
        condition: element.properties.gridAutoFlow.active && element.properties.display.active && element.properties.display.keyword.includes('grid')
      },
      {
        property: 'height',
        value: element.properties.height.value + element.properties.height.unit,
        condition: element.properties.height.active,
      },
      {
        property: 'width',
        value: element.properties.width.value + element.properties.width.unit,
        condition: element.properties.width.active,
      },
      {
        property: 'background',
        value: getBackgroundStyling(element),
        condition: element.properties.background.active,
      },
      {
        property: 'color',
        value: element.properties.color.hex,
        condition: element.properties.color.active && currentSelectionHasText(element),
      },
      {
        property: 'font-size',
        value: element.properties.fontSize.value + element.properties.fontSize.unit,
        condition: element.properties.fontSize.active && currentSelectionHasText(element),
      },
      {
        property: 'font-weight',
        value: element.properties.fontWeight.value.toString(),
        condition: element.properties.fontWeight.active && currentSelectionHasText(element),
      },
      {
        property: 'text-align',
        value: element.properties.textAlign.keyword,
        condition: element.properties.textAlign.active && currentSelectionHasText(element),
      },
      {
        property: 'border',
        value: `${element.properties.border.width.value + element.properties.border.width.unit} ${element.properties.border.style} ${element.properties.border.color}`,
        condition: element.properties.border.active,
      },
      {
        property: 'border-radius',
        value: element.properties.borderRadius.value + element.properties.borderRadius.unit,
        condition: element.properties.borderRadius.active,
      },
      {
        property: 'margin',
        value: element.properties.margin.value + element.properties.margin.unit,
        condition: element.properties.margin.active,
      },
      {
        property: 'padding',
        value: element.properties.padding.value + element.properties.padding.unit,
        condition: element.properties.padding.active,
      },
      {
        property: 'cursor',
        value: element.properties.cursor.keyword,
        condition: element.properties.padding.active,
      },
    ];
  }

  /**
   * Get the conditions when an attribute should be used for an element, and what the value should be
   * @param {Element} element Element to get its attribute conditions
   * @returns {ConditionalValue[]} conditions when an attribute should be used for an element, and what the value should be
   */
  const getAttributeConditions = (element: Element): ConditionalValue[] => {
    return [
      {
        property: 'id',
        value: element.attributes.id,
        condition: true
      },
      {
        property: 'type',
        value: element.attributes.type,
        condition: element.selector === 'input' || element.selector === 'button'
      },
      {
        property: 'value',
        value: getCurrentValue(element),
        condition: (element.selector === 'input' && element.attributes.type !== 'checkbox') || element.selector === 'textarea'
      },
      {
        property: 'checked',
        value: isChecked(element),
        condition: element.selector === 'input'
      }
    ]
  }

  /**
   * Get the current element
   * @param {TreeNode[]} nodes Nodes to search for the current element
   * @returns {Element | undefined} The current element, or undefined if not found
   */
  const getSelectedNode = (nodes: TreeNode[] = tree): TreeNode | undefined => {
    return nodes.reduce((element: TreeNode | undefined, node) => {
      if (element)
        return element;
  
      if (node.element.uuid === selectedElementId)
        return node;
  
      if (node.children)
        return getSelectedNode(node.children);
      }, undefined);
  };
  const selectedElement = getSelectedNode()!.element;
  const currentProperties = selectedElement.properties;
  const currentAttributes = selectedElement.attributes;

  /**
   * Update a property of the current element
   * @param {keyof Element} property Property to update
   * @param {any} value Value to update the property to
   */
  const updateField = (property: keyof Element, value: unknown): void => {
    setTree(prevHierarchy => {
      const updatePropertyRecursively = (nodes: TreeNode[]): TreeNode[] => {
        return nodes.map(node => {
          if (node.element.uuid === selectedElementId) {
            const updatedElement: Element = {
              ...node.element,
              [property]: value
            };

            return {
              ...node,
              element: updatedElement
            };
          }

          if (node.children) {
            return {
              ...node,
              children: updatePropertyRecursively(node.children)
            };
          }

          return node;
        });
      };

      return updatePropertyRecursively(prevHierarchy);
    });
  };

  const updateProperty = (property: keyof Element['properties'], value: unknown): void => {
    updateField('properties', { ...currentProperties, [property]: value });
  };

  const updateAttribute = (attribute: keyof Element['attributes'], value: unknown): void => {
    updateField('attributes', { ...currentAttributes, [attribute]: value });
  };

  /**
   * Add an element to the nodes
   * @param {Element} element Element to add to the nodes
   */
  const addElement = (element: Element): void => {
    setTree([...tree, { element: { ...element }, onClick: () => setSelectedElementId(element.uuid) } ]);
    setSelectedElementId(element.uuid);

    toast.success('Element has been created!', {
      position: 'bottom-right',
      autoClose: 2000
    })
  }

  /**
   * Change the linear-gradient background when the selected colors are changed
   * @param {ChangeEvent<HTMLInputElement>} event Event that fires when the selected colors are changed
   * @param {number} index The index of the color that is changed, since the linear-gradient consists of multiple colors
   */
  const handleLinearGradientBackgroundChanged = (event: ChangeEvent<HTMLInputElement>, index: number): void => {
    const colors = selectedElement.properties.background.linearGradient.colors;
    colors[index] = event.target.value;
    updateProperty('background', { ...selectedElement.properties.background, linearGradient: { colors: colors } });
  }

  /**
   * Get the value of the background property based on the current state
   * @param {Element} element Element to get the background styling for
   * @returns {string} Returns the string that is used for the background property in the CSS
   */
  const getBackgroundStyling = (element: Element): string => {
    const background = element.properties.background;

    switch (background.selected) {
      case 'color':
        return background.color.color;
      case 'linear-gradient':
        return `linear-gradient(${background.linearGradient.colors[0]}, ${background.linearGradient.colors[1]})`;
      default:
        return '';
    }
  }

  /**
   * Get the input type that should be used to input the value attribute
   * @param {Element} element Element to get the input type for
   * @returns {Type} Returns which type the input field is used for the value input
   */
  const getTypeForUserInput = (element: Element): Type => {
    switch (element.attributes.type) {
      case 'button':
      case 'email':
      case 'password':
      case 'reset':
      case 'search':
      case 'submit':
        return 'text';
      default:
        return element.attributes.type;
    }
  }

  /**
   * Get the value that is used currently, based on the selected input type (e.g. text, number)
   * @param {Element} element Element to get the current value for
   * @returns {string} Returns the current value based on the selected input type
   */
  const getCurrentValue = (element: Element): string => {
    const formattedType = toCamelCase(element.attributes.type) as keyof typeof element.attributes.value;
    return element.attributes.value[formattedType].toString();
  }

  /**
   * Get the type options that are available for the selected element
   * @param {Element} element Element to get the type options for
   * @returns {Type[]} Returns which input types are available for the selected element
   */
  const getTypeOptions = (element: Element): Type[] => {
    const typeOptions = types.slice();

    switch (element.selector) {
      case 'button':
        return typeOptions.filter(type => type === 'button' || type === 'reset' || type === 'submit');
      case 'input':
        return typeOptions;
      default:
        return [];
    }
  }

  const isGridAutoFlowVisible = (element: Element): boolean => {
    return element.properties.display.keyword.includes('grid') && element.properties.display.active;
  }

  /**
   * Get if the 'type' option is visible for the user based on the selected element
   * @param {Element} element Element to get the type option visibility for
   * @returns {boolean} Returns if the type option is visible for the user
   */
  const isTypeVisible = (element: Element): boolean => {
    return element.selector == 'input' || element.selector  == 'button';
  }

  /**
   * Get if the 'innerText' option is visible for the user based on the selected element
   * @param {Element} element Element to get the 'innerText' option visibility for
   * @returns {boolean} Returns if the 'innerText' option is visible for the user
   */
  const isInnerTextVisible = (element: Element): boolean => {
    return element.selector  !== 'input' && element.selector  !== 'textarea';
  }

  /**
   * Get if the 'value' option is visible for the user based on the selected element
   * @param {Element} element Element to get the 'value' option visibility for
   * @returns {boolean} Returns if the 'value' option is visible for the user
   */
  const isValueVisible = (element: Element): boolean => {
    return element.selector  === 'input' || element.selector  === 'textarea';
  }

  /**
   * Get if the checkbox is checked or not
   * @param {Element} element The element to check if it is checked 
   * @returns {boolean} Returns true if the checkbox is checked, false otherwise
   */
  const isChecked = (element: Element): boolean => {
    return element.selector === 'input' && element.attributes.type === 'checkbox' && element.attributes.value.checkbox;
  }

  /**
   * Get if the current state of the element has text on it
   * @param {Element} element Element to check if it has text on it
   * @returns {boolean} Returns if the current state of the element has text on it
   */
  const currentSelectionHasText = (element: Element): boolean => {
    return element.selector  !== 'input' || (element.attributes.type !== 'color' && element.attributes.type !== 'checkbox');
  }

  /**
   * Get a string of valid HTML of the current state of the element
   * @param {TreeNode[]} nodes Nodes to generate HTML for (defaults to the tree)
   * @param {number} indent Indentation level of the HTML (defaults to 0)
   * @returns {string} Returns a string of valid HTML of the current state of the element
   */
  const generateHTML = (nodes: TreeNode[] = tree, indent = 0): string => {
    return nodes.reduce((acc, node) => {
      const { element, children } = node;
      const attributeProperties = getAttributeConditions(element);
      const selfClosingElements = ['input', 'textarea'];
      const isSelfClosing = selfClosingElements.includes(element.selector);
      const spaces = ' '.repeat(indent);

      const attributes = attributeProperties
        .map(attribute => {
          if (!attribute.condition)
            return '';

          // When there is a boolean attribute, we don't need to set the value explicitly (for example with 'checked')
          return typeof attribute.value === 'string'
            ? `${attribute.property}="${attribute.value}"`
            : attribute.property
        })
        .filter(attribute => attribute !== '');

      let attributesString: string;

      // If there is only one attribute, we can put it on the same line. Otherwise, we put all of them below each other
      attributes.length === 1
        ? attributesString = `${attributes[0]}`
        : attributesString = `\n${spaces}  ${attributes.join(`\n${spaces}  `)}\n${spaces}`

      // Self-closing elements cannot have children or innerText
      if (attributeProperties.length > 0 && isSelfClosing)
        return `${acc}${spaces}<${element.selector} ${attributesString} />\n`;

      let result = `${spaces}<${element.selector} ${attributesString}>\n`;

      if (element.innerText)
        result += `${spaces}  ${element.innerText}\n`;
      if (children)
        result += generateHTML(children, indent + 2);

      result += `${spaces}</${element.selector}>\n`;

      return `${acc}${result}`;
    }, '');
  };

  return (
    <div id="element-designer">
      <div id="element-preview">
        <ElementPreview
          tree={tree}
          getStylingConditions={getStylingConditions}
          getCurrentValue={getCurrentValue}
          isChecked={isChecked}
        />
      </div>

      <div id="element-hierarchy">
        <TreeView
          tree={tree}
          onChange={(tree: TreeNode[]) => setTree(tree)}
          toast={toast}
          selectedElementId={selectedElementId}
        />

        <div
          id="add-element-container"
          onClick={() => addElement({ ...deepCopy(defaultElement), uuid: generateUUID(), attributes: { ...deepCopy(defaultElement.attributes), id: generateId('element') } }) }
        >
          <MdAddCircle />
          <p>Add a new element</p>
        </div>
      </div>

      <div id="element-options">
        <h2 className="section-title">Structure (HTML)</h2>
        <hr />

        <div>
          <label htmlFor="element" className="option-name">selector</label>
          <Select
            id="selector"
            value={selectedElement.selector}
            options={selectors.slice()}
            onChange={(event) => {
              const selector = event.target.value as Selector;
              const selfClosingElements = ['input', 'textarea'];
              const currentNode = getSelectedNode();

              if (selfClosingElements.includes(selector) && (currentNode?.children?.length ?? 0)) {
                toast.error(`You can't change this element to a <${selector}>, since it can't have child elements`, {
                  position: 'bottom-right' }
                );
                return;
              }

              updateField('selector', selector);
            }}
          />
        </div>

        <div>
          <label htmlFor="id" className="option-name">id</label>
          <Input
            id="id"
            type="text"
            value={currentAttributes?.id}
            onChange={(event) => updateAttribute('id', event.target.value)}
          />
        </div>

        {
          isTypeVisible(selectedElement) &&
            <div>
              <label htmlFor="type" className="option-name">type</label>
              <Select
                id="type"
                value={currentAttributes?.type}
                options={getTypeOptions(selectedElement)}
                onChange={(event) => updateAttribute('type', event.target.value)}
                />
            </div>
        }
      
        {
          isInnerTextVisible(selectedElement) &&
            <div>
              <label htmlFor="innerText" className="option-name">innerText</label>
              <Input
                id="innerText"
                type="text"
                value={selectedElement.innerText}
                onChange={(event) => updateField('innerText', event.target.value)}
              />
            </div>
        }

        {
          isValueVisible(selectedElement) &&
            <div className={!currentAttributes?.value.active ? 'hidden' : ''}>
              <label htmlFor="value" className="option-name">value</label>
              <Input
                id="value"
                type={selectedElement.selector === 'input' ? getTypeForUserInput(selectedElement) : 'text'}
                value={selectedElement.selector === 'input' ? getCurrentValue(selectedElement) : currentAttributes?.value.text}
                checked={isChecked(selectedElement)}
                onChange={(event) => {
                  const value = currentAttributes?.type === 'checkbox' ? event.target.checked : event.target.value;

                  updateAttribute('value', { ...currentAttributes?.value, [currentAttributes?.type]: value });
                }}
              />
            </div>
        }
      </div>

      <div id="styling-options">
        <h2 className="section-title">Styling (CSS)</h2>
        <hr />

        <div className={!currentProperties?.display.active ? 'hidden' : ''}>
          <Input type="checkbox" checked={currentProperties?.display.active} onChange={() => updateProperty('display', { ...currentProperties?.display, active: !currentProperties?.display.active } )} />

          <label htmlFor="display" className="option-name">display</label>
          <Select
            id="display"
            value={currentProperties?.display.keyword}
            options={displayKeywords.slice()}
            onChange={(event) => updateProperty('display', { ...currentProperties?.display, keyword: event.target.value } )}
          />
        </div>

        {
          isGridAutoFlowVisible(selectedElement) &&
            <div className={!currentProperties?.gridAutoFlow.active ? 'hidden' : ''}>
              <Input type="checkbox" checked={currentProperties?.gridAutoFlow.active} onChange={() => updateProperty('gridAutoFlow', { ...currentProperties?.gridAutoFlow, active: !currentProperties?.gridAutoFlow.active } )} />

              <label htmlFor="gridAutoFlow" className="option-name">grid-auto-flow</label>
              <Select
                id="gridAutoFlow"
                value={currentProperties?.gridAutoFlow.keyword}
                options={gridAutoFlowKeywords.slice()}
                onChange={(event) => updateProperty('gridAutoFlow', { ...currentProperties?.gridAutoFlow, keyword: event.target.value } )}
              />
            </div>
        }

        <div className={!currentProperties?.height.active ? 'hidden' : ''}>
          <Input type="checkbox" checked={currentProperties?.height.active} onChange={() => updateProperty('height', { ...currentProperties?.height, active: !currentProperties?.height.active } )} />
          <label htmlFor="height" className="option-name">height</label>
          <UnitSelect
            id="height"
            value={currentProperties?.height.value}
            unit={currentProperties?.height.unit} 
            valueOnChange={(event) => updateProperty('height', { ...currentProperties?.height, value: Number(event.target.value) })}
            unitOnChange={(event) => updateProperty('height', { ...currentProperties?.height, unit: event.target.value })}
          />
        </div>

        <div className={!currentProperties?.width.active ? 'hidden' : ''}>
          <Input type="checkbox" checked={currentProperties?.width.active} onChange={() => updateProperty('width', { ...currentProperties?.width, active: !currentProperties?.width.active } )} />

          <label htmlFor="width" className="option-name">width</label>
          <UnitSelect
            id="width"
            value={currentProperties?.width.value}
            unit={currentProperties?.width.unit} 
            valueOnChange={(event) => updateProperty('width', { ...currentProperties?.height, value: Number(event.target.value) })}
            unitOnChange={(event) => updateProperty('width', { ...currentProperties?.height, unit: event.target.value })}
          />
        </div>

        <div className={!currentProperties?.background.active ? 'hidden' : ''}>
          <Input type="checkbox" checked={currentProperties?.background.active} onChange={() => updateProperty('background', { ...currentProperties?.background, active: !currentProperties?.background.active } )} />

          <label htmlFor="background-property" className="option-name">background</label>
          <Select
            id="background-property"
            value={currentProperties?.background.selected}
            options={backgroundProperties.slice()}
            onChange={(event) => updateProperty('background', { ...currentProperties?.background, selected: event.target.value })}
          />
  
          {
            currentProperties?.background.selected == 'color' &&
              <Input
                type="color"
                value={currentProperties?.background.color.color}
                onChange={(event) => updateProperty('background', { ...currentProperties?.background, color: { ...currentProperties?.background.color, color: event.target.value } })}
              />
          }
          {
            currentProperties?.background.selected == 'linear-gradient' &&
              <>
                <Input
                  type="color"
                  value={currentProperties?.background.linearGradient.colors[0]}
                  onChange={(event) => handleLinearGradientBackgroundChanged(event, 0)}
                />
                <Input
                  type="color"
                  value={currentProperties?.background.linearGradient.colors[1]}
                  onChange={(event) => handleLinearGradientBackgroundChanged(event, 1)}
                />
              </>
          }
        </div>

        {
          currentSelectionHasText(selectedElement) &&
            <div className={!currentProperties?.color.active ? 'hidden' : ''}>
              <Input type="checkbox" checked={currentProperties?.color.active} onChange={() => updateProperty('color', { ...currentProperties?.color, active: !currentProperties?.color.active } )} />

              <label htmlFor="color" className="option-name">color</label>
              <Input
                id="color"
                type="color"
                value={currentProperties?.color.hex}
                onChange={(event) => updateProperty('color', { ...currentProperties?.border, hex: event.target.value } )}
              />
            </div>
        }

        {
          currentSelectionHasText(selectedElement) &&
          <div className={!currentProperties?.fontSize.active ? 'hidden' : ''}>
              <Input type="checkbox" checked={currentProperties?.fontSize.active} onChange={() => updateProperty('fontSize', { ...currentProperties?.fontSize, active: !currentProperties?.fontSize.active } )} />

              <label htmlFor="font-size" className="option-name">font-size</label>
              <UnitSelect
                id="font-size"
                value={currentProperties?.fontSize.value}
                unit={currentProperties?.fontSize.unit} 
                valueOnChange={(event) => updateProperty('fontSize', { ...currentProperties?.fontSize, value: Number(event.target.value) })}
                unitOnChange={(event) => updateProperty('fontSize', { ...currentProperties?.fontSize, unit: event.target.value })}
              />
            </div>
        }

        {
          currentSelectionHasText(selectedElement) &&
            <div className={!currentProperties?.fontWeight.active ? 'hidden' : ''}>
              <Input type="checkbox" checked={currentProperties?.fontWeight.active} onChange={() => updateProperty('fontWeight', { ...currentProperties?.fontWeight, active: !currentProperties?.fontWeight.active } )} />

              <label htmlFor="font-weight" className="option-name">font-weight</label>
              <Input
                id="font-weight"
                type="number"
                value={currentProperties?.fontWeight.value}
                min={100}
                max={900}
                step={100}
                onChange={(event) => updateProperty('fontWeight', { ...currentProperties?.cursor, value: Number(event.target.value) } )}
                />
            </div>
        }

        {
          currentSelectionHasText(selectedElement) &&
            <div className={!currentProperties?.textAlign.active ? 'hidden' : ''}>
              <Input type="checkbox" checked={currentProperties?.textAlign.active} onChange={() => updateProperty('textAlign', { ...currentProperties?.textAlign, active: !currentProperties?.textAlign.active } )} />

              <label htmlFor="cursor" className="option-name">text-align</label>
              <Select
                id="cursor"
                value={currentProperties?.textAlign.keyword}
                options={textAlignKeywords.slice()}
                onChange={(event) => updateProperty('textAlign', { ...currentProperties?.textAlign, keyword: event.target.value } )}
              />
            </div>
        }

        <div className={!currentProperties?.border.active ? 'hidden' : ''}>
          <Input type="checkbox" checked={currentProperties?.border.active} onChange={() => updateProperty('border', { ...currentProperties?.border, active: !currentProperties?.border.active } )}  />

          <label htmlFor="border" className="option-name">border</label>
          <UnitSelect
            value={currentProperties?.border.width.value}
            unit={currentProperties?.border.width.unit} 
            valueOnChange={(event) => updateProperty('border', { ...currentProperties?.border, width: { ...currentProperties?.border.width, value: Number(event.target.value) } })}
            unitOnChange={(event) => updateProperty('border', { ...currentProperties?.border, width: { ...currentProperties?.border.width, unit: event.target.value } })}
          />
          <Select
            value={currentProperties?.border.style}
            options={borderStyles.slice()}
            onChange={(event) => updateProperty('border', { ...currentProperties?.border, style: event.target.value } )}
          />
          <Input
            type="color"
            value={currentProperties?.border.color}
            onChange={(event) => updateProperty('border', { ...currentProperties?.border, color: event.target.value } )}
          />
        </div>

        <div className={!currentProperties?.borderRadius.active ? 'hidden' : ''}>
          <Input type="checkbox" checked={currentProperties?.borderRadius.active} onChange={() => updateProperty('borderRadius', { ...currentProperties?.borderRadius, active: !currentProperties?.borderRadius.active } )} />

          <label htmlFor="border-radius" className="option-name">border-radius</label>
          <UnitSelect
            id="border-radius"
            value={currentProperties?.borderRadius.value}
            unit={currentProperties?.borderRadius.unit} 
            valueOnChange={(event) => updateProperty('borderRadius', { ...currentProperties?.borderRadius, value: Number(event.target.value) })}
            unitOnChange={(event) => updateProperty('borderRadius', { ...currentProperties?.borderRadius, unit: event.target.value })}
          />
        </div>

        <div className={!currentProperties?.margin.active ? 'hidden' : ''}>
          <Input type="checkbox" checked={currentProperties?.margin.active} onChange={() => updateProperty('margin', { ...currentProperties?.margin, active: !currentProperties?.margin.active } )}  />

          <label htmlFor="padding" className="option-name">margin</label>
          <UnitSelect
            id="padding"
            value={currentProperties?.margin.value}
            unit={currentProperties?.margin.unit} 
            valueOnChange={(event) => updateProperty('margin', { ...currentProperties?.margin, value: Number(event.target.value) })}
            unitOnChange={(event) => updateProperty('margin', { ...currentProperties?.margin, unit: event.target.value })}
          />
        </div>

        <div className={!currentProperties?.padding.active ? 'hidden' : ''}>
          <Input type="checkbox" checked={currentProperties?.padding.active} onChange={() => updateProperty('padding', { ...currentProperties?.padding, active: !currentProperties?.padding.active } )}  />

          <label htmlFor="padding" className="option-name">padding</label>
          <UnitSelect
            id="padding"
            value={currentProperties?.padding.value}
            unit={currentProperties?.padding.unit} 
            valueOnChange={(event) => updateProperty('padding', { ...currentProperties?.padding, value: Number(event.target.value) })}
            unitOnChange={(event) => updateProperty('padding', { ...currentProperties?.padding, unit: event.target.value })}
          />
        </div>

        <div className={!currentProperties?.cursor.active ? 'hidden' : ''}>
          <Input type="checkbox" checked={currentProperties?.cursor.active} onChange={() => updateProperty('cursor', { ...currentProperties?.cursor, active: !currentProperties?.cursor.active } )} />

          <label htmlFor="cursor" className="option-name">cursor</label>
          <Select
            id="cursor"
            value={currentProperties?.cursor.keyword}
            options={cursorKeywords.slice()}
            onChange={(event) => updateProperty('cursor', { ...currentProperties?.cursor, keyword: event.target.value } )}
          />
        </div>
      </div>

      <div id="element-code">
        <pre id="button-html" className="code-container">
          {generateHTML()}
          <MdContentCopy className="copy-button" onClick={() => navigator.clipboard.writeText(generateHTML())} />
        </pre>

        <pre id="button-css" className="code-container">
          {StyleEngine.generateCSS(tree)}
          <MdContentCopy className="copy-button" onClick={() => navigator.clipboard.writeText(StyleEngine.generateCSS(tree))} />
        </pre>
      </div>

      <ToastContainer />
    </div>
  )
}

export default ElementDesigner;
