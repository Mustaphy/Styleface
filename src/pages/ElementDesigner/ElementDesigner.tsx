import { ChangeEvent, useState } from 'react';
import './ElementDesigner.css'
import { Background, Border, BorderRadius, FontSize, Padding, Value } from './element-designer-types';
import Input from '../../components/Input/Input'
import { InputType } from '../../components/Input/input-types';
import UnitSelect from '../../components/UnitSelect/UnitSelect';
import Select from "../../components/Select/Select";
import { MdContentCopy } from "react-icons/all";
import PreviewElement from '../../components/PreviewElement/PreviewElement';

function ElementDesigner() {
  const [element, setElement] = useState('button');
  const [inputType, setInputType] = useState('text');
  const [innerText, setInnerText] = useState('Design your own element!');
  const [value, setValue] = useState({
    button: 'Click here!',
    color: '#000000',
    date: new Date().toString(),
    email: 'example@domain.com',
    month: 'July',
    number: '1453',
    password: 'admin',
    reset: 'Reset',
    search: '',
    submit: 'Submit',
    tel: '+31 12 3456789',
    text: 'Type here...',
    time: new Date().toString(),
    url: 'example.com',
    week: '1',
  } as Value);
  const [background, setBackground] = useState({
    selected: 'color',
    color: { color: '#000000' },
    linearGradient: { colors: ['#000000', '#ffffff'] }
  } as Background);
  const [color, setColor] = useState('#ffffff');
  const [fontSize, setFontSize] = useState({
    value: 16,
    unit: 'px'
  } as FontSize);
  const [fontWeight, setFontWeight] = useState('400');
  const [border, setBorder] = useState({
    width: { value: 1, unit: 'px' },
    style: 'solid',
    color: '#ffffff'
  } as Border);
  const [borderRadius, setBorderRadius] = useState({
    value: 8,
    unit: 'px'
  } as BorderRadius);
  const [padding, setPadding] = useState({
    value: 8,
    unit: 'px'
  } as Padding);
  const [cursor, setCursor] = useState('pointer');

  const elementOptions = [
    'a', 'abbr', 'address', 'article', 'aside', 'b', 'bdi', 'bdo', 'blockquote', 'button',
    'cite', 'code', 'div', 'em', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'i', 'input', 'ins', 'kbd',
    'label', 'main', 'mark', 'nav', 'output', 'p', 'param', 'pre', 'q', 's', 'samp', 'section', 'small', 'span',
    'strong', 'sub', 'sup', 'textarea', 'time', 'u', 'var'
  ];
  const inputTypeOptions = [
    'button', 'date', 'datetime-local', 'email', 'month', 'number', 'password', 'reset', 'search', 'submit', 'tel',
    'text', 'time', 'url', 'week'
  ]
  const backgroundOptions = ['color', 'linear-gradient'];
  const fontWeightOptions = ['100', '200', '300', '400', '500', '600', '700', '800', '900'];
  const borderOptions = ['solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset'];
  const cursorOptions = [
    'pointer', 'default', 'none', 'context-menu', 'help', 'progress', 'wait', 'cell', 'crosshair', 'text',
    'vertical-text', 'alias', 'copy', 'move', 'no-drop', 'not-allowed', 'grab', 'grabbing', 'all-scroll', 'col-resize',
    'row-resize', 'n-resize', 'e-resize', 's-resize', 'w-resize', 'ne-resize', 'nw-resize', 'se-resize', 'sw-resize',
    'ew-resize', 'ns-resize', 'nesw-resize', 'nwse-resize', 'zoom-in', 'zoom-out'
  ];

  const handleLinearGradientBackgroundChanged = (event: ChangeEvent<HTMLInputElement>, index: number): void => {
    const colors = background.linearGradient.colors;
    colors[index] = event.target.value;
    setBackground({ ...background, linearGradient: { colors: colors } });
  }

  const getInputType = () => {
    return Object.keys(value).find(type => type === inputType) as InputType
  }

  const getBackground = (): string => {
    switch (background.selected) {
      case 'color':
        return background.color.color;
      case 'linear-gradient':
        return `linear-gradient(${background.linearGradient.colors[0]}, ${background.linearGradient.colors[1]})`;
      default:
        return '';
    }
  }
  
  const getInputTypeForUser = (): InputType => {
    switch (inputType) {
      case 'number':
        return InputType.Number;
      case 'date':
        return InputType.Date;
      case 'time':
        return InputType.Time;
      default:
        return InputType.Text;
    }
  }

  const generateHTML = (): string => {
    switch (element) {
      case 'input':
        return `<${element}\n` +
               `  id="styleface-element"\n` +
               `  type="${inputType}"\n` +
               `  value="${value[getInputType()]}"\n` +
               `/>`;
      case 'textarea':
        return `<${element}\n` +
               `  id="styleface-element"\n` +
               `  value="${value.text}"\n` +
               `/>`;
      default:
        return `<${element} id="styleface-element">\n` +
               `  ${innerText}\n` +
               `</${element}>`;
    }
  }

  const generateCSS = (): string => {
    return (
      `#styleface-element {\n` +
      `  background: ${getBackground()};\n` +
      `  color: ${color};\n` +
      `  font-size: ${fontSize.value + fontSize.unit};\n` +
      `  font-weight: ${fontWeight};\n` +
      `  border: ${border.width.value + border.width.unit} ${border.style} ${border.color};\n` +
      `  border-radius: ${borderRadius.value + borderRadius.unit};\n` +
      `  padding: ${padding.value + padding.unit};\n` +
      `  cursor: ${cursor};\n` +
      `}`
    );
  }

  return (
    <div id="element-designer">
      <div id="element-preview">
        <PreviewElement
          element={element}
          innerText={innerText}
          value={value}
          inputType={inputType}
          style={
            {
              background: getBackground(),
              color: color,
              fontSize: `${fontSize.value + fontSize.unit}`,
              fontWeight: fontWeight,
              border: `${border.width.value + border.width.unit} ${border.style} ${border.color}`,
              borderRadius: `${borderRadius.value + borderRadius.unit}`,
              padding: `${padding.value + padding.unit}`,
              cursor: cursor,
            }
          } />
      </div>

      <div id="styling-options">
        <div id="element-container">
          <label htmlFor="element" className="option-name">element</label>
          <Select id="element" value={element} options={elementOptions} onChange={(event) => setElement(event.target.value)} />
        </div>

        {
          element == 'input' &&
            <div id="input-type-container">
              <label htmlFor="input-type" className="option-name">type</label>
              <Select id="input-type" value={inputType} options={inputTypeOptions} onChange={(event) => setInputType(event.target.value)} />
            </div>
        }

        {
          element !== 'input' && element !== 'textarea' &&
            <div id="innerText-container">
              <label htmlFor="innerText" className="option-name">innerText</label>
              <Input id="innerText" type={InputType.Text} value={innerText} onChange={(event) => setInnerText(event.target.value)} />
            </div>
        }

        {
          (element === 'input' || element === 'textarea') &&
            <div id="value-container">
              <label htmlFor="value" className="option-name">value</label>
              <Input
                id="value"
                type={getInputTypeForUser()}
                value={element === 'input' ? value[getInputType()] : value.text}
                onChange={
                  (event) => setValue((previousValue) => ({
                    ...previousValue,
                    [element === 'input' ? getInputType() : 'text']: event.target.value,
                  }))
                }
              />
            </div>
        }

        <div id="background-container">
          <label htmlFor="background-type" className="option-name">background</label>
          <Select id="background-type" value={background.selected} options={backgroundOptions} onChange={(event) => setBackground({ ...background, selected: event.target.value })} />
  
          {
            background.selected == 'color' &&
              <Input type={InputType.Color} value={background.color.color} onChange={(event) => setBackground({ ...background, color: { color: event.target.value } })} />
          }
          {
            background.selected == 'linear-gradient' &&
              <>
                <Input type={InputType.Color} value={background.linearGradient.colors[0]} onChange={(event) => handleLinearGradientBackgroundChanged(event, 0)} />
                <Input type={InputType.Color} value={background.linearGradient.colors[1]} onChange={(event) => handleLinearGradientBackgroundChanged(event, 1)} />
              </>
          }
        </div>

        <div id="color-container">
          <label htmlFor="color" className="option-name">color</label>
          <Input id="color" type={InputType.Color} value={color} onChange={(event) => setColor(event.target.value)} />
        </div>

        <div id="font-size-container">
          <label htmlFor="font-size" className="option-name">font-size</label>
          <UnitSelect
            id="font-size"
            value={fontSize.value}
            unit={fontSize.unit} 
            valueOnChange={(event) => setFontSize({ ...fontSize, value: Number(event.target.value) })}
            unitOnChange={(event) => setFontSize({ ...fontSize, unit: event.target.value })}
          />
        </div>

        <div id="font-weight-container">
          <label htmlFor="font-weight" className="option-name">font-weight</label>
          <Select id="font-weight" value={fontWeight} options={fontWeightOptions} onChange={(event) => setFontWeight(event.target.value)} />
        </div>

        <div id="border-container">
          <label htmlFor="border" className="option-name">border</label>
          <UnitSelect
            value={border.width.value}
            unit={border.width.unit} 
            valueOnChange={(event) => setBorder({ ...border, width: { ...border.width, value: Number(event.target.value) } })}
            unitOnChange={(event) => setBorder({ ...border, width: { ...border.width, unit: event.target.value } })}
          />
          <Select value={border.style} options={borderOptions} onChange={(event) => setBorder({ ...border, style: event.target.value })} />
          <Input type={InputType.Color} value={border.color} onChange={(event) => setBorder({ ...border, color: event.target.value })} />
        </div>

        <div id="border-radius-container">
          <label htmlFor="border-radius" className="option-name">border-radius</label>
          <UnitSelect
            id="border-radius"
            value={borderRadius.value}
            unit={borderRadius.unit} 
            valueOnChange={(event) => setBorderRadius({ ...borderRadius, value: Number(event.target.value) })}
            unitOnChange={(event) => setBorderRadius({ ...borderRadius, unit: event.target.value })}
          />
        </div>

        <div id="padding-container">
          <label htmlFor="padding" className="option-name">padding</label>
          <UnitSelect
            id="padding"
            value={padding.value}
            unit={padding.unit} 
            valueOnChange={(event) => setPadding({ ...padding, value: Number(event.target.value) })}
            unitOnChange={(event) => setPadding({ ...padding, unit: event.target.value })}
          />
        </div>

        <div id="cursor-container">
          <label htmlFor="cursor" className="option-name">cursor</label>
          <Select id="cursor" value={cursor} options={cursorOptions} onChange={(event) => setCursor(event.target.value)} />
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