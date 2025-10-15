/* eslint-disable no-nested-ternary */
import { SIGNIN } from '@/constants/routes';
import { calculateTotal } from '@/helpers/utils';
import React from 'react';
import { useSelector } from 'react-redux';
import { Redirect, withRouter } from 'react-router-dom';

const withCheckout = (Component) => withRouter((props) => {
  const state = useSelector((store) => ({
    // isAuth: !!store.auth.id && !!store.auth.role,
    basket: store.basket,
    shipping: store.checkout.shipping,
    payment: store.checkout.payment,
    profile: store.profile
  }));

  const shippingFee = state.shipping.isInternational ? 1 : 0;
  const subtotal = calculateTotal(state.basket.map((product) => product.price * product.quantity));

  if (state.basket.length === 0) {
    return <Redirect to="/" />;
  } 
  
  return (
    <Component
      // eslint-disable-next-line react/jsx-props-no-spreading
      {...props}
      basket={state.basket}
      payment={state.payment}
      profile={state.profile}
      shipping={state.shipping}
      subtotal={Number(subtotal + shippingFee)}
    />
  );
});

export default withCheckout;
