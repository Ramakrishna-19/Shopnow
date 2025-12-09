import React, { useState, useEffect } from 'react'
import './ListProduct.css'
import cross_icon from '../../assets/cross_icon.png'

const ListProduct = () => {

    const [allproducts, setAllProducts] = useState([]);

    const fetchInfo = async () => {
        await fetch('https://shopnow-backend-6i14.onrender.com/allproducts')
        .then((res)=>res.json())
        .then((data)=>{ setAllProducts(data) })
    }

    useEffect(() => {
        fetchInfo();
    }, []);

    const remove_product = async (id) => {
        await fetch('https://shopnow-backend-6i14.onrender.com/removeproduct', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ id:id })
        });

        alert("Product Removed");
        fetchInfo(); // Refresh list after deletion
    }

  return (
    <div className='list-product'>
      <h1>All Products List</h1>

      <div className="listproduct-format-main">
        <p>Products</p>
        <p>Title</p>
        <p>Old Price</p>
        <p>New Price</p>
        <p>Category</p>
        <p>Remove</p>
      </div>

      <div className="listproduct-allproducts">
        <hr />

        {allproducts.map((product, index) => {
            return (
              <div key={index}>
                <div className="listproduct-format-main listproduct-format">
                    <img src={product.image} className='listproduct-product-icon' alt="product" />

                    <p>{product.name}</p>
                    <p>₹{product.old_price}</p>
                    <p>₹{product.new_price}</p>
                    <p>{product.category}</p>

                    <img 
                      onClick={() => remove_product(product.id)} 
                      src={cross_icon} 
                      alt="remove" 
                      className="listproduct-remove-icon" 
                    />
                </div>
                <hr />
              </div>
            )
        })}

      </div>
    </div>
  )
}

export default ListProduct
