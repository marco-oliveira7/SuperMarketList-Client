import { useEffect, useState } from "react";
import { socket } from "./socket";
import { ProductModel } from "./model/products-model";

function App() {

  const [isConnected, setIsConnected] = useState(socket.connected);
  const [products, setProducts] = useState<ProductModel[]>();
  const [productSearched, setProductSearched] = useState("");
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [nameProduct, setNameProduct] = useState("");

  async function setAllProducts() {
    const res = await fetch("http://localhost:1000/api/products");
    const data = await res.json();
    setProducts(data);
  }

  useEffect(() => {
    function onConnect() {
      setIsConnected(true);
    }

    function onDisconnect() {
      setIsConnected(false);
    }

    setAllProducts();

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  useEffect(() => {
    socket.on("checked_receive", (data) => {
      const inputs1 = document.querySelectorAll('input[type="checkbox"]');
      const inputs = inputs1 as NodeListOf<HTMLInputElement>;
      inputs[data.id].checked = true;
    });
    socket.on("unchecked_receive", (data) => {
      const inputs1 = document.querySelectorAll('input[type="checkbox"]');
      const inputs = inputs1 as NodeListOf<HTMLInputElement>;
      inputs[data.id].checked = false;
    });
    socket.on("delete_receive", (data) => {
      setProducts(data.newProducts);
      window.location.reload();
    });
    socket.on("create_receive", () => {
      window.location.reload();
    });
  }, [socket]);

  useEffect(() => {
    const inputs = document.querySelectorAll('input[type="checkbox"]');
    inputs.forEach((input1) => {
      const input = input1 as HTMLInputElement;
      input.addEventListener("click", () => {
        const id = parseInt(input.id);
        if (input.checked === true) {
          socket.emit("checked", { id });
        } else if (input.checked === false) {
          socket.emit("unchecked", { id });
        }
      });
    });
  });

  function handleProductSearched(e: React.ChangeEvent<HTMLInputElement>) {
    setProductSearched(e.target.value);
    if (e.target.value === "") {
      setAllProducts();
    }
  }

  function searchProduct() {
    const newProducts = products?.filter((p) =>
      p.name.toLowerCase().includes(productSearched.toLowerCase())
    );
    setProducts(newProducts);
  }

  function deleteProduct(id: string) {
    const requestOptions = {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    };

    fetch(`http://localhost:1000/api/products/${id}`, requestOptions);

    const newProducts = products?.filter((p) => p.id !== id);
    setProducts(newProducts);
    const idInt = parseInt(id);
    socket.emit("delete", { idInt, newProducts });
    window.location.reload();
  }

  function createProduct() {
    const requestOptions = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: products?.length.toString(),
        name: nameProduct,
        isChecked: false,
      }),
    };

    fetch("http://localhost:1000/api/products", requestOptions).then((res) =>
      console.log(res)
    );
    socket.emit("create");
  }

  const handleCheckedProduct = async (productId: string) => {
    setProducts((prevProducts) =>
      prevProducts?.map((p) =>
        p.id === productId ? { ...p, isChecked: !p.isChecked } : p
      )
    );

    const requestOptions = {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
    };

    fetch(
      `http://localhost:1000/api/products/${productId}`,
      requestOptions
    ).then((res) => console.log(res));

    // socket.emit("create");
  };

  return (
    <div className="h-screen w-screen bg-yellow-50 flex justify-center items-center">
      <div className="main">
        <h1 className="text-3xl my-4 text-center">Lista de Compras</h1>
        <input
          type="text"
          onChange={handleProductSearched}
          value={productSearched}
          placeholder="Digite aqui o produto que deseja"
          className="bg-white border-2 outline-0 px-2 border-neutral-900 rounded-2xl"
        />
        <button onClick={searchProduct}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="ml-5 w-5 cursor-pointer"
            viewBox="0 0 512 512"
          >
            <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z" />
          </svg>
        </button>
        <div className="flex justify-around my-5 border-2 rounded-xl">
          <h1>Criar Produto</h1>
          <button
            onClick={() =>
              isCreatingProduct === false
                ? setIsCreatingProduct(true)
                : setIsCreatingProduct(false)
            }
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="ml-5 w-5 cursor-pointer"
              viewBox="0 0 448 512"
            >
              <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z" />
            </svg>
          </button>
        </div>
        <ul className="my-5">
          {products &&
            products.map((product) => (
              <li
                key={product.id}
                className="cursor-pointer relative flex items-center justify-between border-2 my-4 px-2 rounded-xl"
              >
                <input
                  className="m-2 appearance-none cursor-pointer"
                  checked={product.isChecked}
                  type="checkbox"
                  id={product.id}
                  onChange={() => handleCheckedProduct(product.id)}
                />
                <p className="px-4">{product.name}</p>
                <svg
                  onClick={() => deleteProduct(product.id)}
                  className="w-4 cursor-pointer"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 448 512"
                >
                  <path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z" />
                </svg>
              </li>
            ))}
        </ul>
        {isCreatingProduct && (
          <div className="main product">
            <button
              onClick={() =>
                isCreatingProduct === true
                  ? setIsCreatingProduct(false)
                  : setIsCreatingProduct(true)
              }
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 384 512"
                className="w-4 cursor-pointer"
              >
                <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" />
              </svg>
            </button>
            <form
              action=""
              className="h-10/12 flex flex-col justify-between items-center"
            >
              <input
                type="text"
                placeholder="nome do produto"
                value={nameProduct}
                onChange={(e) => setNameProduct(e.target.value)}
                className="bg-white border-2 outline-0 px-2 border-neutral-900 rounded-2xl"
              />
              <button
                type="submit"
                onClick={createProduct}
                className="border-2 rounded-xl px-2"
              >
                Criar Produto
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
