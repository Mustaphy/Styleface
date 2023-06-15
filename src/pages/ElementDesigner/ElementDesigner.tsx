import { ChangeEvent, useState } from 'react';
import './ElementDesigner.css';
import {
  BackgroundProperty,
  BorderStyle,
  CursorKeyword,
  ElementSelector,
  backgroundProperties,
  borderStyles,
  cursorKeywords,
  elementSelectors,
  Element,
  ConditionalValue,
} from './ElementDesignerTypes';
import Input from '../../components/Input/Input'
import UnitSelect from '../../components/UnitSelect/UnitSelect';
import Select from "../../components/Select/Select";
import { MdContentCopy, MdAddCircle } from "react-icons/all";
import { generateId, generateUUID, toCamelCase, toKebabCase } from '../../utilities';
import { Type as Type, types } from '../../components/Input/InputTypes';
import { Unit } from '../../components/UnitSelect/UnitSelectTypes';
import TreeView from '../../components/TreeView/TreeView';
import ElementPreview from '../../components/ElementPreview.tsx/ElementPreview';
import { TreeNode } from '../../components/TreeView/TreeViewTypes';
import { buttonElement } from './ElementDesignerData';

function ElementDesigner() {
  const initialElement: Element = buttonElement;
  const [currentElementId, setCurrentElementId] = useState(initialElement.uuid);
  const [tree, setTree] = useState<TreeNode[]>([
    {
      element: initialElement,
      onClick: () => setCurrentElementId(initialElement.uuid!),
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
        property: 'height',
        condition: element.height.active,
        value: `${element.height.value + element.height.unit}`
      },
      {
        property: 'width',
        condition: element.width.active,
        value: `${element.width.value + element.width.unit}`
      },
      {
        property: 'background',
        condition: element.background.active,
        value: `${getBackgroundStyling(element)}` 
      },
      {
        property: 'color',
        condition: element.color.active && currentSelectionHasText(element),
        value: `${element.color.hex}`
      },
      {
        property: 'fontSize',
        condition: element.fontSize.active && currentSelectionHasText(element),
        value: `${element.fontSize.value + element.fontSize.unit}`
      },
      {
        property: 'fontWeight',
        condition: element.fontWeight.active && currentSelectionHasText(element),
        value: `${element.fontWeight.value}`
      },
      {
        property: 'border',
        condition: element.border.active,
        value: `${element.border.width.value + element.border.width.unit} ${element.border.style} ${element.border.color}`
      },
      {
        property: 'borderRadius',
        condition: element.borderRadius.active,
        value: `${element.borderRadius.value + element.borderRadius.unit}`
      },
      {
        property: 'padding',
        condition: element.padding.active,
        value: `${element.padding.value + element.padding.unit}`
      },
      {
        property: 'cursor',
        condition: element.padding.active,
        value: `${element.cursor.keyword}`
      },
    ];
  }

  /**
   * Get the conditions when an attribute should be used for an element, and what the value should be
   * @param {Element} element Element to get its attribute conditions
   * @returns {AttributeCondition[]} conditions when an attribute should be used for an element, and what the value should be
   */
  const getAttributeConditions = (element: Element): ConditionalValue[] => {
    return [
      {
        property: 'id',
        condition: true,
        value: element.id,
      },
      {
        property: 'type',
        condition: element.element === 'input' || element.element === 'button',
        value: element.type,
      },
      {
        property: 'value',
        condition: (element.element === 'input' && element.type !== 'checkbox') || element.element === 'textarea',
        value: getCurrentValue(element),
      },
      {
        property: 'checked',
        condition: element.element === 'input',
        value: isChecked(element),
      }
    ]
  }

  /**
   * Get the current element
   * @param {TreeNode[]} nodes Nodes to search for the current element
   * @returns {Element | undefined} The current element, or undefined if not found
   */
  const getCurrentElement = (nodes: TreeNode[] = tree): Element | undefined => {
    for (const node of nodes) {
      if (node.element.uuid === currentElementId) {
        return node.element;
      }
      if (node.children) {
        const foundNode = getCurrentElement(node.children);
        if (foundNode) {
          return foundNode;
        }
      }
    }

    return undefined;
  }

  /**
   * Update a property of the current element
   * @param {keyof Element} property Property to update
   * @param {any} value Value to update the property to
   */
  const updateProperty = (property: keyof Element, value: any): void => {
    setTree(prevHierarchy => {
      const updatePropertyRecursively: any = (nodes: any): void => {
        return nodes.map((node: any) => {
          if (node.element.uuid === currentElementId) {
            const updatedElement = {
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

  /**
   * Add an element to the nodes
   * @param {Element} element Element to add to the nodes
   */
  const addElement = (element: Element): void => {
    setTree([...tree, { element: { ...element }, onClick: () => setCurrentElementId(element.uuid!) } ]);
    setCurrentElementId(element.uuid!);
  }

  /**
   * Change the linear-gradient background when the selected colors are changed
   * @param {ChangeEvent<HTMLInputElement>} event Event that fires when the selected colors are changed
   * @param {number} index The index of the color that is changed, since the linear-gradient consists of mulitple colors
   */
  const handleLinearGradientBackgroundChanged = (event: ChangeEvent<HTMLInputElement>, index: number): void => {
    const colors = getCurrentElement()!.background.linearGradient.colors;
    colors[index] = event.target.value;
    updateProperty('background', { ...getCurrentElement()!.background, linearGradient: { colors: colors } });
  }

  /**
   * Get the value of the background property based on the current state
   * @param {Element} element Element to get the background styling for
   * @returns {string} Returns the string that is used for the background property in the CSS
   */
  const getBackgroundStyling = (element: Element): string => {
    const background = element.background;

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
    switch (element.type) {
      case 'button':
      case 'email':
      case 'password':
      case 'reset':
      case 'search':
      case 'submit':
        return 'text';
      default:
        return element.type;
    }
  }

  /**
   * Get the value that is used currently, based on the selected input type (e.g. text, number)
   * @param {Element} element Element to get the current value for
   * @returns {string} Returns the current value based on the selected input type
   */
  const getCurrentValue = (element: Element): string => {
    const formattedType = toCamelCase(element.type) as keyof typeof element.value;
    return element.value[formattedType].toString();
  }

  /**
   * Get the type options that are available for the selected element
   * @param {Element} element Element to get the type options for
   * @returns {Type[]} Returns which input types are available for the selected element
   */
  const getTypeOptions = (element: Element): Type[] => {
    const typeOptions = types.slice();

    switch (element.element) {
      case 'button':
        return typeOptions.filter(type => type === 'button' || type === 'reset' || type === 'submit');
      case 'input':
        return typeOptions;
      default:
        return [];
    }
  }

  /**
   * Get if the 'type' option is visible for the user based on the selected element
   * @param {Element} element Element to get the type option visibility for
   * @returns {boolean} Returns if the type option is visible for the user
   */
  const isTypeVisible = (element: Element): boolean => {
    return element.element == 'input' || element.element  == 'button';
  }

  /**
   * Get if the 'innerText' option is visible for the user based on the selected element
   * @param {Element} element Element to get the 'innerText' option visibility for
   * @returns {boolean} Returns if the 'innerText' option is visible for the user
   */
  const isInnerTextVisible = (element: Element): boolean => {
    return element.element  !== 'input' && element.element  !== 'textarea';
  }

  /**
   * Get if the 'value' option is visible for the user based on the selected element
   * @param {Element} element Element to get the 'value' option visibility for
   * @returns {boolean} Returns if the 'value' option is visible for the user
   */
  const isValueVisible = (element: Element): boolean => {
    return element.element  === 'input' || element.element  === 'textarea';
  }

  /**
   * Get if the checkbox is checked or not
   * @param {Element} element The element to check if it is checked 
   * @returns {boolean} Returns true if the checkbox is checked, false otherwise
   */
  const isChecked = (element: Element): boolean => {
    return element.element === 'input' && element.type === 'checkbox' && element.value.checkbox;
  }

  /**
   * Get if the current state of the element has text on it
   * @param {Element} element Element to check if it has text on it
   * @returns {boolean} Returns if the current state of the element has text on it
   */
  const currentSelectionHasText = (element: Element): boolean => {
    return element.element  !== 'input' || (element.type !== 'color' && element.type !== 'checkbox');
  }

  /**
   * Get a string of valid HTML of the current state of the element
   * @param {TreeNode[]} nodes Nodes to generate HTML for (defaults to the indent)
   * @param {number} indent Indentation level of the HTML (defaults to 0)
   * @returns {string} Returns a string of valid HTML of the current state of the element
   */
  const generateHTML = (nodes: TreeNode[] = tree, indent: number = 0): string => {
    const spaces = ' '.repeat(indent);

    return nodes.reduce((acc, node) => {
      const { element, children } = node;
      const attributeProperties = getAttributeConditions(element);
      const selfClosingElements = ['input', 'textarea'];
      const isSelfClosing = selfClosingElements.includes(element.element);

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

      let attributesString = '';

      // If there is only one attribute, we can put it on the same line. Otherwise we put all of them below each other
      attributes.length === 1
        ? attributesString = `${attributes[0]}`
        : attributesString = `\n${spaces}  ${attributes.join(`\n${spaces}  `)}\n${spaces}`

      // Self closing elements cannot have children or innerText
      if (attributeProperties.length > 0 && isSelfClosing)
        return `${acc}${spaces}<${element.element} ${attributesString} />\n`;

      let result = `${spaces}<${element.element} ${attributesString}>\n`;

      if (element.innerText)
        result += `${spaces}  ${element.innerText}\n`;
      if (children)
        result += generateHTML(children, indent + 2);

      result += `${spaces}</${element.element}>\n`;

      return `${acc}${result}`;
    }, '');
  };

  /**
   * Get a string of valid CSS of the current state of the element
   * @returns {string} Returns a string of valid CSS of the current state of the element
   */
  const generateCSS = (): string => {
    let css = '';

    const getStylingForNode = (nodes: TreeNode[]): void => {
      nodes.forEach(node => {
        const { element, children } = node;
  
        css += `#${element.id} {\n`;
  
        const propertyConditions = getStylingConditions(node.element);

        propertyConditions.forEach(condition => {
          const { property, condition: propertyCondition, value: style } = condition;
  
          if (propertyCondition)
            css += `  ${toKebabCase(property)}: ${style};\n`;
        });
  
        css += `}\n\n`;
  
        if (children)
          getStylingForNode(children);
      }
    )};
  
    getStylingForNode(tree);
    return css;
  }

  return (
    <div id="element-designer">
      <div id="element-preview">
        <ElementPreview tree={tree} getPropertyConditions={getStylingConditions} />
      </div>

      <div id="element-hierarchy">
        <TreeView data={tree} onChange={(tree: TreeNode[]) => setTree(tree)} selectedElementId={currentElementId} />

        <div
          id="add-element-container"
          onClick={() => addElement({ ...initialElement, uuid: generateUUID(), id: generateId('element') }) }
        >
          <MdAddCircle />
          <p>Add a new element</p>
        </div>
      </div>

      <div id="element-options">
        <h2 className="section-title">Structure (HTML)</h2>
        <hr />

        <div>
          <label htmlFor="element" className="option-name">element</label>
          <Select
            id="element"
            value={getCurrentElement()!.element}
            options={elementSelectors.slice()}
            onChange={(event) => updateProperty('element', event.target.value as ElementSelector)}
          />
        </div>

        <div>
          <label htmlFor="id" className="option-name">id</label>
          <Input
            id="id"
            type="text"
            value={getCurrentElement()!.id}
            onChange={(event) => updateProperty('id', event.target.value)}
          />
        </div>

        {
          isTypeVisible(getCurrentElement()!) &&
            <div>
              <label htmlFor="type" className="option-name">type</label>
              <Select
                id="type"
                value={getCurrentElement()!.type}
                options={getTypeOptions(getCurrentElement()!)}
                onChange={(event) => updateProperty('type', event.target.value as Type)}
                />
            </div>
        }
      
        {
          isInnerTextVisible(getCurrentElement()!) &&
            <div>
              <label htmlFor="innerText" className="option-name">innerText</label>
              <Input
                id="innerText"
                type="text"
                value={getCurrentElement()!.innerText}
                onChange={(event) => updateProperty('innerText', event.target.value)}
              />
            </div>
        }

        {
          isValueVisible(getCurrentElement()!) &&
            <div className={!getCurrentElement()!.value.active ? 'hidden' : ''}>
              <label htmlFor="value" className="option-name">value</label>
              <Input
                id="value"
                type={getCurrentElement()!.element === 'input' ? getTypeForUserInput(getCurrentElement()!) : 'text'}
                value={getCurrentElement()!.element === 'input' ? getCurrentValue(getCurrentElement()!) : getCurrentElement()!.value.text}
                checked={isChecked(getCurrentElement()!)}
                onChange={(event) => {
                  const currentElement = getCurrentElement()!;
                  const value = currentElement.type === 'checkbox' ? event.target.checked : event.target.value;

                  updateProperty('value', { ...getCurrentElement()!.value, [getCurrentElement()!.type]: value });
                }}
              />
            </div>
        }
      </div>

      <div id="styling-options">
        <h2 className="section-title">Styling (CSS)</h2>
        <hr />

        <div className={!getCurrentElement()!.height.active ? 'hidden' : ''}>
          <Input type="checkbox" checked={getCurrentElement()!.height.active} onChange={() => updateProperty('height', { ...getCurrentElement()!.height, active: !getCurrentElement()!.height.active } )} />
          <label htmlFor="height" className="option-name">height</label>
          <UnitSelect
            id="height"
            value={getCurrentElement()!.height.value}
            unit={getCurrentElement()!.height.unit} 
            valueOnChange={(event) => updateProperty('height', { ...getCurrentElement()!.height, value: Number(event.target.value) })}
            unitOnChange={(event) => updateProperty('height', { ...getCurrentElement()!.height, value: Number(event.target.value) })}
          />
        </div>

        <div className={!getCurrentElement()!.width.active ? 'hidden' : ''}>
          <Input type="checkbox" checked={getCurrentElement()!.width.active} onChange={() => updateProperty('width', { ...getCurrentElement()!.width, active: !getCurrentElement()!.width.active } )} />

          <label htmlFor="width" className="option-name">width</label>
          <UnitSelect
            id="width"
            value={getCurrentElement()!.width.value}
            unit={getCurrentElement()!.width.unit} 
            valueOnChange={(event) => updateProperty('width', { ...getCurrentElement()!.height, value: Number(event.target.value) })}
            unitOnChange={(event) => updateProperty('width', { ...getCurrentElement()!.height, unit: event.target.value as Unit })}
          />
        </div>

        <div className={!getCurrentElement()!.background.active ? 'hidden' : ''}>
          <Input type="checkbox" checked={getCurrentElement()!.background.active} onChange={() => updateProperty('background', { ...getCurrentElement()!.background, active: !getCurrentElement()!.background.active } )} />

          <label htmlFor="background-property" className="option-name">background</label>
          <Select
            id="background-property"
            value={getCurrentElement()!.background.selected}
            options={backgroundProperties.slice()}
            onChange={(event) => updateProperty('background', { ...getCurrentElement()!.background, selected: event.target.value as BackgroundProperty })}
          />
  
          {
            getCurrentElement()!.background.selected == 'color' &&
              <Input
                type="color"
                value={getCurrentElement()!.background.color.color}
                onChange={(event) => updateProperty('background', { ...getCurrentElement()!.background, color: { ...getCurrentElement()!.background.color, color: event.target.value } })}
              />
          }
          {
            getCurrentElement()!.background.selected == 'linear-gradient' &&
              <>
                <Input
                  type="color"
                  value={getCurrentElement()!.background.linearGradient.colors[0]}
                  onChange={(event) => handleLinearGradientBackgroundChanged(event, 0)}
                />
                <Input
                  type="color"
                  value={getCurrentElement()!.background.linearGradient.colors[1]}
                  onChange={(event) => handleLinearGradientBackgroundChanged(event, 1)}
                />
              </>
          }
        </div>

        {
          currentSelectionHasText(getCurrentElement()!) &&
            <div className={!getCurrentElement()!.color.active ? 'hidden' : ''}>
              <Input type="checkbox" checked={getCurrentElement()!.color.active} onChange={() => updateProperty('color', { ...getCurrentElement()!.color, active: !getCurrentElement()!.color.active } )} />

              <label htmlFor="color" className="option-name">color</label>
              <Input
                id="color"
                type="color"
                value={getCurrentElement()!.color.hex}
                onChange={(event) => updateProperty('color', { ...getCurrentElement()!.border, hex: event.target.value } )}
              />
            </div>
        }

        {
          currentSelectionHasText(getCurrentElement()!) &&
          <div className={!getCurrentElement()!.fontSize.active ? 'hidden' : ''}>
              <Input type="checkbox" checked={getCurrentElement()!.fontSize.active} onChange={() => updateProperty('fontSize', { ...getCurrentElement()!.fontSize, active: !getCurrentElement()!.fontSize.active } )} />

              <label htmlFor="font-size" className="option-name">font-size</label>
              <UnitSelect
                id="font-size"
                value={getCurrentElement()!.fontSize.value}
                unit={getCurrentElement()!.fontSize.unit} 
                valueOnChange={(event) => updateProperty('fontSize', { ...getCurrentElement()!.fontSize, value: Number(event.target.value) })}
                unitOnChange={(event) => updateProperty('fontSize', { ...getCurrentElement()!.fontSize, unit: event.target.value as Unit })}
              />
            </div>
        }

        {
          currentSelectionHasText(getCurrentElement()!) &&
            <div className={!getCurrentElement()!.fontWeight.active ? 'hidden' : ''}>
              <Input type="checkbox" checked={getCurrentElement()!.fontWeight.active} onChange={() => updateProperty('fontWeight', { ...getCurrentElement()!.fontWeight, active: !getCurrentElement()!.fontWeight.active } )} />

              <label htmlFor="font-weight" className="option-name">font-weight</label>
              <Input
                id="font-weight"
                type="number"
                value={getCurrentElement()!.fontWeight.value}
                min={100}
                max={900}
                step={100}
                onChange={(event) => updateProperty('fontWeight', { ...getCurrentElement()!.cursor, value: Number(event.target.value) } )}
                />
            </div>
        }

        <div className={!getCurrentElement()!.border.active ? 'hidden' : ''}>
          <Input type="checkbox" checked={getCurrentElement()!.border.active} onChange={() => updateProperty('border', { ...getCurrentElement()!.border, active: !getCurrentElement()!.border.active } )}  />

          <label htmlFor="border" className="option-name">border</label>
          <UnitSelect
            value={getCurrentElement()!.border.width.value}
            unit={getCurrentElement()!.border.width.unit} 
            valueOnChange={(event) => updateProperty('border', { ...getCurrentElement()!.border, width: { ...getCurrentElement()!.border.width, value: Number(event.target.value) } })}
            unitOnChange={(event) => updateProperty('border', { ...getCurrentElement()!.border, width: { ...getCurrentElement()!.border.width, unit: event.target.value as Unit } })}
          />
          <Select
            value={getCurrentElement()!.border.style}
            options={borderStyles.slice()}
            onChange={(event) => updateProperty('border', { ...getCurrentElement()!.border, style: event.target.value as BorderStyle } )}
          />
          <Input
            type="color"
            value={getCurrentElement()!.border.color}
            onChange={(event) => updateProperty('border', { ...getCurrentElement()!.border, color: event.target.value } )}
          />
        </div>

        <div className={!getCurrentElement()!.borderRadius.active ? 'hidden' : ''}>
          <Input type="checkbox" checked={getCurrentElement()!.borderRadius.active} onChange={() => updateProperty('borderRadius', { ...getCurrentElement()!.borderRadius, active: !getCurrentElement()!.borderRadius.active } )} />

          <label htmlFor="border-radius" className="option-name">border-radius</label>
          <UnitSelect
            id="border-radius"
            value={getCurrentElement()!.borderRadius.value}
            unit={getCurrentElement()!.borderRadius.unit} 
            valueOnChange={(event) => updateProperty('borderRadius', { ...getCurrentElement()!.borderRadius, value: Number(event.target.value) })}
            unitOnChange={(event) => updateProperty('borderRadius', { ...getCurrentElement()!.borderRadius, unit: event.target.value as Unit })}
          />
        </div>

        <div className={!getCurrentElement()!.padding.active ? 'hidden' : ''}>
          <Input type="checkbox" checked={getCurrentElement()!.padding.active} onChange={() => updateProperty('padding', { ...getCurrentElement()!.padding, active: !getCurrentElement()!.padding.active } )}  />

          <label htmlFor="padding" className="option-name">padding</label>
          <UnitSelect
            id="padding"
            value={getCurrentElement()!.padding.value}
            unit={getCurrentElement()!.padding.unit} 
            valueOnChange={(event) => updateProperty('padding', { ...getCurrentElement()!.padding, value: Number(event.target.value) })}
            unitOnChange={(event) => updateProperty('padding', { ...getCurrentElement()!.padding, unit: event.target.value as Unit })}
          />
        </div>

        <div className={!getCurrentElement()!.cursor.active ? 'hidden' : ''}>
          <Input type="checkbox" checked={getCurrentElement()!.cursor.active} onChange={() => updateProperty('cursor', { ...getCurrentElement()!.cursor, active: !getCurrentElement()!.cursor.active } )} />

          <label htmlFor="cursor" className="option-name">cursor</label>
          <Select
            id="cursor"
            value={getCurrentElement()!.cursor.keyword}
            options={cursorKeywords.slice()}
            onChange={(event) => updateProperty('cursor', { ...getCurrentElement()!.cursor, keyword: event.target.value as CursorKeyword } )}
          />
        </div>
      </div>

      <div id="element-code">
        <pre id="button-html" className="code-container">
          {generateHTML()}
          <MdContentCopy className="copy-button" onClick={() => navigator.clipboard.writeText(generateHTML())} />
        </pre>

        <pre id="button-css" className="code-container">
          {generateCSS()}
          <MdContentCopy className="copy-button" onClick={() => navigator.clipboard.writeText(generateCSS())} />
        </pre>
      </div>
    </div>
  )
}

export default ElementDesigner;
