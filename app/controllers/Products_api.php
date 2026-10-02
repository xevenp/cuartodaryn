<?php

class Products_api extends Controller
{
    public function before_action()
    {
        $this->call->database();
        $this->call->library('api');
        $this->call->model('Product_model');
    }

    public function index()
    {
        $this->api->require_method('GET');
        $this->api->require_scope('read');
        $this->api->respond(['data' => $this->Product_model->order_by('id', 'DESC')]);
    }

    public function store()
    {
        $this->api->require_method('POST');
        $this->api->require_scope('write');
        $data = $this->validated_product($this->api->body());
        $id = $this->Product_model->insert($data);
        $this->api->respond(['data' => $this->Product_model->find($id)], 201);
    }

    public function update($id)
    {
        $this->api->require_scope('write');
        $product = $this->Product_model->find((int) $id);
        if (!$product) {
            $this->api->respond_error('Product not found.', 404);
        }

        $this->Product_model->update((int) $id, $this->validated_product($this->api->body()));
        $this->api->respond(['data' => $this->Product_model->find((int) $id)]);
    }

    public function destroy($id)
    {
        $this->api->require_method('DELETE');
        $this->api->require_scope('delete');
        if (!$this->Product_model->find((int) $id)) {
            $this->api->respond_error('Product not found.', 404);
        }

        $this->Product_model->delete((int) $id);
        $this->api->respond(['message' => 'Product deleted.']);
    }

    private function validated_product($body)
    {
        $name = trim($body['product_name'] ?? '');
        $description = trim($body['description'] ?? '');
        $price = $body['price'] ?? null;
        $quantity = $body['quantity'] ?? null;

        if ($name === '' || strlen($name) > 100 || !is_numeric($price) || !is_numeric($quantity) || (float) $price < 0 || (int) $quantity < 0) {
            $this->api->respond_error('Provide a product name, a non-negative price, and a non-negative quantity.', 422);
        }

        return [
            'product_name' => $name,
            'description' => $description,
            'price' => number_format((float) $price, 2, '.', ''),
            'quantity' => (int) $quantity,
        ];
    }
}