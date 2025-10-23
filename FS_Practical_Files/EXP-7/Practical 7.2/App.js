// App.js
import React from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
import store from "./store";
import { addToCart, removeFromCart, updateQuantity } from "./cartSlice";
import "./App.css";

const products = [
  { name: "Laptop", price: 1200 },
  { name: "Mouse", price: 25 },
  { name: "Keyboard", price: 45 }
];

function ProductList() {
  const dispatch = useDispatch();

  return (
    <div>
      <h2>Products</h2>
      <div className="products">
        {products.map((p) => (
          <div key={p.name} className="product-card">
            <h3>{p.name}</h3>
            <p>${p.price}</p>
            <button onClick={() => dispatch(addToCart(p))}>Add to Cart</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Cart() {
  const cart = useSelector((state) => state.cart.items);
  const dispatch = useDispatch();

  return (
    <div>
      <h2>Shopping Cart</h2>
      {cart.length === 0 && <p>No items in cart</p>}
      {cart.map((item) => (
        <div key={item.name} className="cart-item">
          <span>
            {item.name} (${item.price})
          </span>
          <input
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) =>
              dispatch(updateQuantity({ name: item.name, quantity: e.target.value }))
            }
          />
          <button onClick={() => dispatch(removeFromCart(item.name))}>Remove</button>
        </div>
      ))}
    </div>
  );
}

function AppContent() {
  return (
    <div className="app">
      <h1>My Shop</h1>
      <ProductList />
      <Cart />
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
