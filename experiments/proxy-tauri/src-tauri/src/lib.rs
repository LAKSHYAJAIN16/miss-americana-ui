use socks::Socks4Stream;
use std::io::{Read, Write};
use std::net::TcpStream;
use rand::seq::SliceRandom;

struct Proxy {
    host: String,
    port: u16,
}

fn get_random_proxy() -> Proxy {
    let proxies = vec![
        Proxy { host: "72.10.164.178".to_string(), port: 32379 },
        Proxy { host: "23.94.137.176".to_string(), port: 1080 },
        Proxy { host: "45.77.247.63".to_string(), port: 9050 },
        Proxy { host: "198.8.80.254".to_string(), port: 1080 },
    ];

    let mut rng = rand::thread_rng();
    proxies.choose(&mut rng).unwrap().to_owned()
}

fn main() -> std::io::Result<()> {
    let proxy = get_random_proxy();

    let target_host = "example.com";
    let target_port = 80;

    println!(
        "Connecting to {}:{} through SOCKS4 proxy {}:{}...",
        target_host, target_port, proxy.host, proxy.port
    );

    // SOCKS4 requires user_id, can be empty string
    let mut stream = Socks4Stream::connect(
        (proxy.host.as_str(), proxy.port),
        (target_host, target_port),
        "",
    )?;

    // Send a basic HTTP GET request
    let request = format!(
        "GET / HTTP/1.1\r\nHost: {}\r\nConnection: close\r\n\r\n",
        target_host
    );
    stream.write_all(request.as_bytes())?;

    // Read and print the response
    let mut response = String::new();
    stream.read_to_string(&mut response)?;
    println!("Response:\n{}", response);

    Ok(())
}
