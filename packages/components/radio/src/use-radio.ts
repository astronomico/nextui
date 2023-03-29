import type {AriaRadioProps} from "@react-types/radio";
import type {RadioVariantProps, RadioSlots, SlotsToClasses} from "@nextui-org/theme";

import {Ref, ReactNode, useCallback, useId} from "react";
import {useMemo, useRef} from "react";
import {useFocusRing} from "@react-aria/focus";
import {useHover} from "@react-aria/interactions";
import {radio} from "@nextui-org/theme";
import {useRadio as useReactAriaRadio} from "@react-aria/radio";
import {HTMLNextUIProps, PropGetter} from "@nextui-org/system";
import {__DEV__, warn, clsx, dataAttr} from "@nextui-org/shared-utils";
import {useDOMRef} from "@nextui-org/dom-utils";
import {mergeProps} from "@react-aria/utils";

import {useRadioGroupContext} from "./radio-group-context";

interface Props extends HTMLNextUIProps<"label"> {
  /**
   * Ref to the DOM node.
   */
  ref?: Ref<HTMLElement>;
  /**
   * The label of the checkbox.
   */
  children?: ReactNode;
  /**
   * The radio description text.
   */
  description?: string | ReactNode;
  /**
   * Classname or List of classes to change the styles of the element.
   * if `className` is passed, it will be added to the base slot.
   *
   * @example
   * ```ts
   * <Radio styles={{
   *    base:"base-classes",
   *    wrapper: "wrapper-classes",
   *    point: "control-classes", // inner circle
   *    labelWrapper: "label-wrapper-classes", // this wraps the label and description
   *    label: "label-classes",
   *    description: "description-classes",
   * }} />
   * ```
   */
  styles?: SlotsToClasses<RadioSlots>;
}

export type UseRadioProps = Omit<Props, "defaultChecked"> &
  Omit<AriaRadioProps, keyof RadioVariantProps> &
  Omit<RadioVariantProps, "isFocusVisible">;

export function useRadio(props: UseRadioProps) {
  const groupContext = useRadioGroupContext();

  const {
    as,
    ref,
    styles,
    id,
    value,
    children,
    description,
    size = groupContext?.size ?? "md",
    color = groupContext?.color ?? "primary",
    radius = groupContext?.radius ?? "full",
    isDisabled: isDisabledProp = groupContext?.isDisabled ?? false,
    disableAnimation = groupContext?.disableAnimation ?? false,
    autoFocus = false,
    className,
    ...otherProps
  } = props;

  if (groupContext && __DEV__) {
    if ("checked" in otherProps) {
      warn('Remove props "checked" if in the Radio.Group.', "Radio");
    }
    if (value === undefined) {
      warn('Props "value" must be defined if in the Radio.Group.', "Radio");
    }
  }

  const Component = as || "label";

  const domRef = useDOMRef(ref);
  const inputRef = useRef<HTMLInputElement>(null);

  const labelId = useId();

  const isDisabled = useMemo(() => !!isDisabledProp, [isDisabledProp]);
  const isRequired = useMemo(() => groupContext.isRequired ?? false, [groupContext.isRequired]);
  const isInvalid = useMemo(
    () => groupContext.validationState === "invalid",
    [groupContext.validationState],
  );

  const ariaRadioProps = useMemo(() => {
    const ariaLabel =
      otherProps["aria-label"] || typeof children === "string" ? (children as string) : undefined;
    const ariaDescribedBy =
      otherProps["aria-describedby"] || typeof description === "string"
        ? (description as string)
        : undefined;

    return {
      id,
      isDisabled,
      isRequired,
      "aria-label": ariaLabel,
      "aria-labelledby": otherProps["aria-labelledby"] || labelId,
      "aria-describedby": ariaDescribedBy,
    };
  }, [labelId, id, isDisabled, isRequired]);

  const {inputProps} = useReactAriaRadio(
    {
      value,
      children,
      ...groupContext,
      ...ariaRadioProps,
    },
    groupContext.groupState,
    inputRef,
  );

  const isSelected = useMemo(() => inputProps.checked, [inputProps.checked]);

  const {hoverProps, isHovered} = useHover({isDisabled});

  const {focusProps, isFocused, isFocusVisible} = useFocusRing({
    autoFocus,
  });

  const slots = useMemo(
    () =>
      radio({
        color,
        size,
        radius,
        isInvalid,
        isDisabled,
        isFocusVisible,
        disableAnimation,
      }),
    [color, size, radius, isDisabled, isInvalid, isFocusVisible, disableAnimation],
  );

  const baseStyles = clsx(styles?.base, className);

  const getBaseProps: PropGetter = (props = {}) => {
    return {
      ...props,
      ref: domRef,
      className: slots.base({class: baseStyles}),
      "data-disabled": dataAttr(isDisabled),
      "data-checked": dataAttr(inputProps.checked),
      "data-invalid": dataAttr(isInvalid),
      ...mergeProps(hoverProps, otherProps),
    };
  };

  const getWrapperProps: PropGetter = (props = {}) => {
    return {
      ...props,
      "data-active": dataAttr(isSelected),
      "data-hover": dataAttr(isHovered),
      "data-hover-unchecked": dataAttr(isHovered && !isSelected),
      "data-checked": dataAttr(isSelected),
      "data-focus": dataAttr(isFocused),
      "data-focus-visible": dataAttr(isFocused && isFocusVisible),
      "data-disabled": dataAttr(isDisabled),
      "data-invalid": dataAttr(isInvalid),
      "data-readonly": dataAttr(inputProps.readOnly),
      "aria-required": dataAttr(isRequired),
      "aria-hidden": true,
      className: clsx(slots.wrapper({class: styles?.wrapper})),
    };
  };

  const getInputProps: PropGetter = (props = {}) => {
    return {
      ...props,
      ref: inputRef,
      required: isRequired,
      "aria-required": dataAttr(isRequired),
      "data-invalid": dataAttr(isInvalid),
      "data-readonly": dataAttr(inputProps.readOnly),
      ...mergeProps(inputProps, focusProps),
    };
  };

  const getLabelProps: PropGetter = useCallback(
    (props = {}) => ({
      ...props,
      id: labelId,
      "data-disabled": dataAttr(isDisabled),
      "data-checked": dataAttr(isSelected),
      "data-invalid": dataAttr(isInvalid),
      className: slots.label({class: styles?.label}),
    }),
    [slots, styles, isDisabled, isSelected, isInvalid],
  );

  const getLabelWrapperProps: PropGetter = useCallback(
    (props = {}) => ({
      ...props,
      className: slots.labelWrapper({class: styles?.labelWrapper}),
    }),
    [slots, styles],
  );

  const getControlProps: PropGetter = useCallback(
    (props = {}) => ({
      ...props,
      "data-disabled": dataAttr(isDisabled),
      "data-checked": dataAttr(isSelected),
      "data-invalid": dataAttr(isInvalid),
      className: slots.control({class: styles?.control}),
    }),
    [slots, isDisabled, isSelected, isInvalid],
  );

  return {
    Component,
    children,
    slots,
    styles,
    description,
    isSelected,
    isDisabled,
    isInvalid,
    isFocusVisible,
    getBaseProps,
    getWrapperProps,
    getInputProps,
    getLabelProps,
    getLabelWrapperProps,
    getControlProps,
  };
}

export type UseRadioReturn = ReturnType<typeof useRadio>;
